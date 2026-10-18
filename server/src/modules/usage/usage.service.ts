import { Prisma } from '../../../generated/prisma/client';
import AppError from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import { tenantPrisma, type TenantPrisma } from '../../lib/tenantPrisma';
import {
  addDays,
  fromDay,
  getUsageContext,
  overageCents,
  projectUnits,
  toDay,
  todayUtc,
} from './usage.utils';
import type { TDailyQuery, TUsageInput } from './usage.validation';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 90; // FR-USE-08

type TApiKey = { id: string; organizationId: string };

export type TUsageResult = {
  eventId: string;
  duplicate: boolean;
  periodUnits: number;
  includedUnits: number;
};

const findOriginal = (organizationId: string, idempotencyKey: string) =>
  prisma.usageEvent.findUnique({
    where: { organizationId_idempotencyKey: { organizationId, idempotencyKey } },
    select: { id: true },
  });

const limitReached = (limit: number) =>
  new AppError(
    429,
    'PLAN_LIMIT_USAGE',
    `Monthly usage limit of ${limit.toLocaleString('en-US')} units reached. Upgrade to continue.`,
  );

/**
 * FR-USE-01…06, SRS 16.4. The limit check and the increment are ONE SQL statement:
 * PostgreSQL locks the counter row while updating it, so concurrent requests queue and each
 * sees the previous result — the limit can't be overrun. The event row is written in the
 * same transaction, so a rejected or duplicate request counts nothing.
 */
const recordUsage = async (apiKey: TApiKey, input: TUsageInput): Promise<TUsageResult> => {
  const { organizationId } = apiKey;
  const ctx = await getUsageContext(tenantPrisma(organizationId));
  const periodUnits = async () =>
    (
      await prisma.usageCounter.findUnique({
        where: { organizationId_periodStart: { organizationId, periodStart: ctx.periodStart } },
        select: { units: true },
      })
    )?.units ?? 0;

  // A retry of something already recorded is answered as a duplicate — even at the limit
  const existing = await findOriginal(organizationId, input.idempotencyKey);
  if (existing) {
    return {
      eventId: existing.id.toString(),
      duplicate: true,
      periodUnits: await periodUnits(),
      includedUnits: ctx.includedUnits,
    };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Insert the counter for a new period, or add to it — only if it stays within the limit.
      // No row back = the limit would be exceeded.
      const rows = await tx.$queryRaw<{ units: number }[]>`
        INSERT INTO usage_counters ("organizationId", "periodStart", units, "updatedAt")
        SELECT ${organizationId}, ${ctx.periodStart}, ${input.quantity}, now()
        WHERE ${ctx.limit}::int IS NULL OR ${input.quantity} <= ${ctx.limit}::int
        ON CONFLICT ("organizationId", "periodStart") DO UPDATE
          SET units = usage_counters.units + EXCLUDED.units, "updatedAt" = now()
          WHERE ${ctx.limit}::int IS NULL OR usage_counters.units + EXCLUDED.units <= ${ctx.limit}::int
        RETURNING units`;
      if (rows.length === 0) throw limitReached(ctx.limit!);

      const event = await tx.usageEvent.create({
        data: {
          organizationId,
          apiKeyId: apiKey.id,
          metric: input.metric,
          quantity: input.quantity,
          idempotencyKey: input.idempotencyKey,
          occurredAt: input.occurredAt ?? new Date(),
          periodStart: ctx.periodStart,
          billable: ctx.billable,
        },
        select: { id: true },
      });

      // BigInt ids can't go through JSON.stringify
      return {
        eventId: event.id.toString(),
        duplicate: false,
        periodUnits: rows[0]!.units,
        includedUnits: ctx.includedUnits,
      };
    });
  } catch (err) {
    // Two identical requests at the same moment: the unique index lets one win and the
    // whole transaction of the other (counter included) rolls back
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const original = await findOriginal(organizationId, input.idempotencyKey);
      if (original) {
        return {
          eventId: original.id.toString(),
          duplicate: true,
          periodUnits: await periodUnits(),
          includedUnits: ctx.includedUnits,
        };
      }
    }
    throw err;
  }
};

/** FR-USE-07, endpoint #30: where the organization stands in its current period */
const getSummary = async (db: TenantPrisma, now = new Date()) => {
  const ctx = await getUsageContext(db, now);
  const counter = await db.usageCounter.findFirst({
    where: { periodStart: ctx.periodStart },
    select: { units: true },
  });
  const unitsUsed = counter?.units ?? 0;
  const projectedUnits = projectUnits(unitsUsed, ctx.periodStart, ctx.periodEnd, now);

  return {
    planCode: ctx.planCode,
    periodStart: ctx.periodStart,
    periodEnd: ctx.periodEnd,
    unitsUsed,
    includedUnits: ctx.includedUnits,
    percentUsed:
      ctx.includedUnits > 0 ? Math.round((unitsUsed / ctx.includedUnits) * 1000) / 10 : 0,
    // Free: usage stops at the limit (429). Paid: it continues and is billed as overage.
    overageAllowed: ctx.limit === null,
    limitReached: ctx.limit !== null && unitsUsed >= ctx.limit,
    overageCents: overageCents(unitsUsed, ctx.includedUnits, ctx.overageUnitMicros),
    projectedUnits,
    projectedOverageCents: overageCents(projectedUnits, ctx.includedUnits, ctx.overageUnitMicros),
  };
};

/**
 * FR-USE-08, endpoint #31: one row per day (zero-filled), read from usage_daily_rollups,
 * never from raw events. Rollups are refreshed by the usage-rollup job, so today's number
 * can lag by up to one run.
 */
const getDaily = async (db: TenantPrisma, query: TDailyQuery, now = new Date()) => {
  // Both ends included. Defaults: `to` = today (UTC), `from` = 29 days before `to`.
  const to = query.to ? fromDay(query.to) : todayUtc(now);
  const start = query.from ? fromDay(query.from) : addDays(to, -29);
  if (start > to) {
    throw new AppError(400, 'VALIDATION_ERROR', '`from` must not be after `to`');
  }
  if (Math.round((to.getTime() - start.getTime()) / DAY_MS) + 1 > MAX_DAYS) {
    throw new AppError(400, 'VALIDATION_ERROR', `At most ${MAX_DAYS} days per request`);
  }

  const rows = await db.usageDailyRollup.findMany({
    where: { day: { gte: start, lte: to } },
    select: { day: true, metric: true, quantity: true },
  });

  const byDay = new Map<string, number>();
  const metrics = new Set<string>();
  for (const row of rows) {
    metrics.add(row.metric);
    if (query.metric && row.metric !== query.metric) continue;
    const key = toDay(row.day);
    byDay.set(key, (byDay.get(key) ?? 0) + row.quantity);
  }

  const days: { day: string; units: number }[] = [];
  for (let d = start; d <= to; d = addDays(d, 1)) {
    days.push({ day: toDay(d), units: byDay.get(toDay(d)) ?? 0 });
  }
  return {
    from: toDay(start),
    to: toDay(to),
    metric: query.metric ?? null,
    // Every metric seen in the range, for a filter dropdown
    metrics: [...metrics].sort(),
    totalUnits: days.reduce((sum, d) => sum + d.units, 0),
    days,
  };
};

export const UsageService = { recordUsage, getSummary, getDaily };
