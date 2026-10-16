import type { Plan } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
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
  periodStart: Date;
  includedUnits: number;
  // null = overage allowed (paid plan with full access): no hard limit
  limit: number | null;
};

/**
 * What the usage endpoint needs to know (SRS 12.3, FR-USE-04…06), in one query:
 * - full access on a paid plan → the subscription's Stripe billing period; overage allowed
 *   when the plan prices it, otherwise a hard limit at the included units
 * - anything else (Free, canceled, past the grace period) → the Free plan's hard limit over
 *   the current calendar month in UTC. Computed here rather than read from the subscription
 *   row, so the limit resets on the 1st even if the period job hasn't run yet.
 */
export async function getUsageContext(
  organizationId: string,
  now = new Date(),
): Promise<TUsageContext> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });
  const paid =
    subscription?.plan.stripePriceId &&
    accessLevel(subscription.status, subscription.graceEndsAt, now) === 'FULL';

  if (paid) {
    const { plan } = subscription;
    return {
      periodStart: subscription.currentPeriodStart,
      includedUnits: plan.includedUnits,
      limit: plan.overageUnitMicros > 0 ? null : plan.includedUnits,
    };
  }

  const free = subscription?.plan.stripePriceId === null ? subscription.plan : await getFreePlan();
  return {
    periodStart: currentFreePeriod(now).start,
    includedUnits: free.includedUnits,
    limit: free.includedUnits,
  };
}
