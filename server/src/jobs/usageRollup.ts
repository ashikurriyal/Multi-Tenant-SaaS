import { prisma } from '../lib/prisma';
import type { JobResult } from './registry';

// Usage may arrive up to 24 hours after it happened (FR-USE-02), and a run can be late,
// so the last three UTC days are recomputed every time
const DAYS = 3;

/**
 * SRS section 13. Recomputes recent `usage_daily_rollups` (per organization, metric and
 * UTC day of `occurredAt`) from `usage_events` in one statement. Charts read these rows,
 * never the raw events. Safe to run twice: totals are recomputed, not added.
 */
export async function usageRollup(): Promise<JobResult> {
  const now = new Date();
  const from = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (DAYS - 1)),
  );

  // occurredAt is stored as UTC without a time zone, so ::date is the UTC day
  const rows = await prisma.$executeRaw`
    INSERT INTO usage_daily_rollups ("organizationId", metric, day, quantity)
    SELECT "organizationId", metric, "occurredAt"::date, SUM(quantity)::int
    FROM usage_events
    WHERE "occurredAt" >= ${from}
    GROUP BY "organizationId", metric, "occurredAt"::date
    ON CONFLICT ("organizationId", metric, day) DO UPDATE SET quantity = EXCLUDED.quantity`;

  const result = { from: from.toISOString().slice(0, 10), rows };
  console.info('[usage-rollup]', JSON.stringify(result));
  return result;
}
