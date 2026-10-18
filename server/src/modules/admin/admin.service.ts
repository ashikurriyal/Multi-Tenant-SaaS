import type { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import {
  arpaCents,
  customerChurnRate,
  customersLost,
  mrrCentsOf,
  mrrMovements,
  netRevenueRetention,
  payingCount,
  totalMrr,
  type TMrrByOrg,
} from '../../shared/metrics';
import { accessLevel } from '../../shared/subscriptionState';
import { buildMeta, toSkipTake } from '../../utils/pagination';
import type { TTenantsQuery, TWebhookEventsQuery } from './admin.validation';

type TMonth = {
  month: string; // YYYY-MM
  asOf: string | null; // the snapshot day used as the month's end (null = no data yet)
  start: TMrrByOrg; // MRR at the end of the previous month
  end: TMrrByOrg; // MRR at the end of this month (latest snapshot for the current one)
  paidBefore: (organizationId: string) => boolean;
};

const monthKey = (d: Date) => d.toISOString().slice(0, 7);
const addMonths = (d: Date, n: number) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
const percent = (ratio: number | null) =>
  ratio === null ? null : Math.round(ratio * 10_000) / 100;

/**
 * SRS 12.4: each month compares every organization's MRR on the last snapshot day of the
 * previous month with the last snapshot day of this month. The current month uses the
 * latest snapshot. A month without snapshots carries the previous state forward (no data
 * = no change), so a missed job never shows up as everyone churning.
 */
async function monthlyMrr(months: number, now = new Date()): Promise<TMonth[]> {
  const current = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const first = addMonths(current, -months); // the month before the first one shown

  const [monthEnds, [prior], firstPaid] = await Promise.all([
    prisma.$queryRaw<{ day: Date }[]>`
      SELECT max(day) AS day FROM mrr_snapshots
      WHERE day >= ${first}::date
      GROUP BY date_trunc('month', day)`,
    prisma.$queryRaw<{ day: Date | null }[]>`
      SELECT max(day) AS day FROM mrr_snapshots WHERE day < ${first}::date`,
    prisma.mrrSnapshot.groupBy({
      by: ['organizationId'],
      where: { mrrCents: { gt: 0 } },
      _min: { day: true },
    }),
  ]);

  const endDays = [...monthEnds.map((r) => r.day), ...(prior?.day ? [prior.day] : [])];
  const rows = endDays.length
    ? await prisma.mrrSnapshot.findMany({
        where: { day: { in: endDays } },
        select: { day: true, organizationId: true, mrrCents: true },
      })
    : [];

  const byDay = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const key = row.day.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, new Map());
    byDay.get(key)!.set(row.organizationId, row.mrrCents);
  }
  const endOfMonth = new Map(
    monthEnds.map((r) => [monthKey(r.day), r.day.toISOString().slice(0, 10)]),
  );
  const firstPaidAt = new Map(firstPaid.map((r) => [r.organizationId, r._min.day!]));

  const priorDay = prior?.day ? prior.day.toISOString().slice(0, 10) : null;
  let state: { asOf: string | null; mrr: TMrrByOrg } = {
    asOf: priorDay,
    mrr: (priorDay && byDay.get(priorDay)) || new Map(),
  };
  // Month 0 only provides the starting state
  const monthEnd0 = endOfMonth.get(monthKey(first));
  if (monthEnd0) state = { asOf: monthEnd0, mrr: byDay.get(monthEnd0)! };

  const result: TMonth[] = [];
  for (let i = 1; i <= months; i++) {
    const monthStart = addMonths(first, i);
    const asOf = endOfMonth.get(monthKey(monthStart));
    const next = asOf ? { asOf, mrr: byDay.get(asOf)! } : state;
    result.push({
      month: monthKey(monthStart),
      asOf: next.asOf,
      start: state.mrr,
      end: next.mrr,
      paidBefore: (id) => {
        const at = firstPaidAt.get(id);
        return at !== undefined && at < monthStart;
      },
    });
    state = next;
  }
  return result;
}

/** FR-AN-03, endpoint #34: MRR and its movements per month */
const getMrr = async (months: number) =>
  (await monthlyMrr(months)).map(({ month, asOf, start, end, paidBefore }) => ({
    month,
    asOf,
    mrrCents: totalMrr(end),
    payingCustomers: payingCount(end),
    ...mrrMovements(start, end, paidBefore),
  }));

/** FR-AN-03, endpoint #35: customer churn, NRR and ARPA per month (percentages, 2 decimals) */
const getChurn = async (months: number) =>
  (await monthlyMrr(months)).map(({ month, asOf, start, end, paidBefore }) => {
    const startMrrCents = totalMrr(start);
    const arpa = arpaCents(end);
    return {
      month,
      asOf,
      startCustomers: payingCount(start),
      endCustomers: payingCount(end),
      churnedCustomers: customersLost(start, end),
      customerChurnPercent: percent(customerChurnRate(start, end)),
      startMrrCents,
      mrrCents: totalMrr(end),
      nrrPercent: percent(netRevenueRetention(startMrrCents, mrrMovements(start, end, paidBefore))),
      arpaCents: arpa === null ? null : Math.round(arpa),
    };
  });

/** FR-AN-04, endpoint #36: every organization with plan, status, members and current MRR */
const listTenants = async (query: TTenantsQuery, now = new Date()) => {
  const subscription: Prisma.SubscriptionWhereInput = {
    ...(query.plan && { plan: { code: query.plan } }),
    ...(query.status && { status: query.status }),
  };
  const where: Prisma.OrganizationWhereInput = {
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search.toLowerCase() } },
      ],
    }),
    ...((query.plan || query.status) && { subscription: { is: subscription } }),
  };

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      ...toSkipTake(query),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: { select: { memberships: true } },
        subscription: {
          select: {
            status: true,
            graceEndsAt: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            plan: {
              select: { code: true, name: true, monthlyPriceCents: true, stripePriceId: true },
            },
          },
        },
      },
    }),
    prisma.organization.count({ where }),
  ]);

  const data = organizations.map(({ _count, subscription: sub, ...org }) => ({
    ...org,
    planCode: sub?.plan.code ?? 'FREE',
    planName: sub?.plan.name ?? 'Free',
    status: sub?.status ?? 'ACTIVE',
    accessLevel: sub ? accessLevel(sub.status, sub.graceEndsAt, now) : 'FREE',
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    memberCount: _count.memberships,
    mrrCents: mrrCentsOf(sub ?? null, now),
  }));
  return { data, meta: buildMeta(query, total) };
};

/** FR-AN-05, endpoint #37: the webhook inbox (payloads are never returned, NFR-SEC-08) */
const listWebhookEvents = async (query: TWebhookEventsQuery) => {
  const where = { status: query.status };
  const [events, total] = await Promise.all([
    prisma.stripeEvent.findMany({
      where,
      ...toSkipTake(query),
      orderBy: { receivedAt: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        attempts: true,
        lastError: true,
        nextAttemptAt: true,
        receivedAt: true,
        processedAt: true,
      },
    }),
    prisma.stripeEvent.count({ where }),
  ]);
  return { data: events, meta: buildMeta(query, total) };
};

export const AdminService = { getMrr, getChurn, listTenants, listWebhookEvents };
