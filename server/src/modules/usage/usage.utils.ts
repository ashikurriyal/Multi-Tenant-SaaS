import type { Plan } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import type { TenantPrisma } from '../../lib/tenantPrisma';
import { accessLevel } from '../../shared/subscriptionState';
import { currentFreePeriod } from '../organization/organization.utils';

// The Free plan rarely changes; one lookup per instance every few minutes is plenty
const FREE_PLAN_TTL_MS = 5 * 60 * 1000;
let freePlanCache: { plan: Plan; at: number } | null = null;

async function getFreePlan() {
  if (freePlanCache && Date.now() - freePlanCache.at < FREE_PLAN_TTL_MS) return freePlanCache.plan;
  const plan = await prisma.plan.findUnique({ where: { code: 'FREE' } });
  if (!plan) throw new Error('FREE plan is missing, run the seed');
  freePlanCache = { plan, at: Date.now() };
  return plan;
}

export type TUsageContext = {
  planCode: string;
  periodStart: Date;
  periodEnd: Date;
  includedUnits: number;
  // null = overage allowed (paid plan with full access): no hard limit
  limit: number | null;
  overageUnitMicros: number;
  // Paid plan with full access: the event is reported to Stripe's meter (report-usage job)
  billable: boolean;
};

/**
 * What usage is counted against right now (SRS 12.3, FR-USE-04…06), in one query:
 * - full access on a paid plan → the subscription's Stripe billing period; overage allowed
 *   when the plan prices it, otherwise a hard limit at the included units
 * - anything else (Free, canceled, past the grace period) → the Free plan's hard limit over
 *   the current calendar month in UTC. Computed here rather than read from the subscription
 *   row, so the limit resets on the 1st even if the period job hasn't run yet.
 */
export async function getUsageContext(db: TenantPrisma, now = new Date()): Promise<TUsageContext> {
  const subscription = await db.subscription.findFirst({ include: { plan: true } });
  const paid =
    subscription?.plan.stripePriceId &&
    accessLevel(subscription.status, subscription.graceEndsAt, now) === 'FULL';

  if (paid) {
    const { plan } = subscription;
    const overage = plan.overageUnitMicros > 0;
    return {
      planCode: plan.code,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      includedUnits: plan.includedUnits,
      limit: overage ? null : plan.includedUnits,
      overageUnitMicros: overage ? plan.overageUnitMicros : 0,
      billable: true,
    };
  }

  const free = subscription?.plan.stripePriceId === null ? subscription.plan : await getFreePlan();
  const period = currentFreePeriod(now);
  return {
    planCode: free.code,
    periodStart: period.start,
    periodEnd: period.end,
    includedUnits: free.includedUnits,
    limit: free.includedUnits,
    overageUnitMicros: 0,
    billable: false,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

// 'YYYY-MM-DD' ↔ a Date at UTC midnight (how @db.Date columns come back)
export const toDay = (date: Date) => date.toISOString().slice(0, 10);
export const fromDay = (day: string) => new Date(`${day}T00:00:00.000Z`);
export const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);
export const todayUtc = (now = new Date()) => fromDay(toDay(now));

/**
 * FR-USE-07: units at the current daily average, stretched over the whole period. At least
 * one day counts as elapsed, so a burst in the first hours doesn't project absurd numbers.
 */
export function projectUnits(units: number, periodStart: Date, periodEnd: Date, now = new Date()) {
  const periodMs = periodEnd.getTime() - periodStart.getTime();
  const elapsedMs = now.getTime() - periodStart.getTime();
  if (periodMs <= 0 || elapsedMs >= periodMs) return units;
  return Math.max(units, Math.round((units * periodMs) / Math.max(elapsedMs, DAY_MS)));
}

// overageUnitMicros is millionths of a dollar per unit; 10,000 micros = 1 cent
export const overageCents = (units: number, includedUnits: number, overageUnitMicros: number) =>
  Math.round((Math.max(0, units - includedUnits) * overageUnitMicros) / 10_000);
