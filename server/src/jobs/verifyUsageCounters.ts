import { prisma } from '../lib/prisma';
import { recordAudit } from '../shared/audit';
import type { JobResult } from './registry';

const DAY_MS = 24 * 60 * 60 * 1000;
// Monthly periods: anything that started in the last 40 days is current or just ended
const LOOKBACK_MS = 40 * DAY_MS;

type TDrift = { organizationId: string; periodStart: Date; units: number; actual: number };

/**
 * SRS section 13, daily. Every usage event records the counter period it was added to, so
 * `usage_counters.units` must equal the sum of that period's events. The ingest transaction
 * guarantees it; this job proves it, and repairs and audits (`usage.counter_corrected`)
 * any drift, e.g. after a manual database edit.
 *
 * A repair locks the counter row first. Ingest updates the counter before inserting its
 * event and holds that lock until it commits, so once the lock is ours every request that
 * touched the counter has committed, and the sum read next is exact.
 */
export async function verifyUsageCounters(): Promise<JobResult> {
  const since = new Date(Date.now() - LOOKBACK_MS);

  const counters = await prisma.$queryRaw<TDrift[]>`
    SELECT c."organizationId", c."periodStart", c.units,
           COALESCE(SUM(e.quantity), 0)::int AS actual
    FROM usage_counters c
    LEFT JOIN usage_events e
      ON e."organizationId" = c."organizationId" AND e."periodStart" = c."periodStart"
    WHERE c."periodStart" >= ${since}
    GROUP BY c."organizationId", c."periodStart", c.units
    HAVING c.units <> COALESCE(SUM(e.quantity), 0)`;

  let corrected = 0;
  for (const drift of counters) {
    const fixed = await prisma.$transaction(async (tx) => {
      const [locked] = await tx.$queryRaw<{ units: number }[]>`
        SELECT units FROM usage_counters
        WHERE "organizationId" = ${drift.organizationId} AND "periodStart" = ${drift.periodStart}
        FOR UPDATE`;
      const [sum] = await tx.$queryRaw<{ actual: number }[]>`
        SELECT COALESCE(SUM(quantity), 0)::int AS actual FROM usage_events
        WHERE "organizationId" = ${drift.organizationId} AND "periodStart" = ${drift.periodStart}`;
      const actual = sum?.actual ?? 0;
      if (!locked || locked.units === actual) return false;

      await tx.usageCounter.update({
        where: {
          organizationId_periodStart: {
            organizationId: drift.organizationId,
            periodStart: drift.periodStart,
          },
        },
        data: { units: actual },
      });
      await recordAudit(tx, {
        organizationId: drift.organizationId,
        actorId: null,
        action: 'usage.counter_corrected',
        entityType: 'UsageCounter',
        entityId: drift.periodStart.toISOString(),
        before: { units: locked.units },
        after: { units: actual },
      });
      console.warn(
        `[verify-usage-counters] ${drift.organizationId} ${drift.periodStart.toISOString()}: ${locked.units} → ${actual}`,
      );
      return true;
    });
    if (fixed) corrected += 1;
  }

  const result = { drifted: counters.length, corrected };
  console.info('[verify-usage-counters]', JSON.stringify(result));
  return result;
}
