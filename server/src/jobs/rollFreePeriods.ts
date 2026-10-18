import { prisma } from '../lib/prisma';
import { currentFreePeriod } from '../modules/organization/organization.utils';
import type { JobResult } from './registry';

/**
 * SRS section 13, daily. Moves Free subscriptions whose period has ended to the current
 * calendar month (UTC), so the billing page shows the right dates. The usage limit doesn't
 * wait for this: the usage endpoint computes the Free period itself (FR-USE-06).
 * Safe to run twice: rows already in the current month don't match.
 */
export async function rollFreePeriods(): Promise<JobResult> {
  const now = new Date();
  const period = currentFreePeriod(now);
  const { count } = await prisma.subscription.updateMany({
    where: { plan: { stripePriceId: null }, currentPeriodEnd: { lte: now } },
    data: { currentPeriodStart: period.start, currentPeriodEnd: period.end },
  });

  const result = { rolled: count, periodStart: period.start.toISOString() };
  console.info('[roll-free-periods]', JSON.stringify(result));
  return result;
}
