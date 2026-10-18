import type { SubscriptionStatus } from '../../generated/prisma/client';
import { accessLevel } from './subscriptionState';

/**
 * SRS section 12.4 — revenue metrics. Pure functions, so `npm run check:metrics` can prove
 * them against the worked example. All amounts are integer cents.
 */

type TMrrSubscription = {
  status: SubscriptionStatus;
  graceEndsAt: Date | null;
  plan: { monthlyPriceCents: number; stripePriceId: string | null };
} | null;

/**
 * Recurring plan fee of one organization right now. Counts only paid plans with full
 * access; trials are left out until they convert (they haven't paid), and overage is
 * usage revenue, not MRR.
 */
export function mrrCentsOf(subscription: TMrrSubscription, now = new Date()) {
  if (!subscription?.plan.stripePriceId) return 0;
  if (subscription.status === 'TRIALING') return 0;
  if (accessLevel(subscription.status, subscription.graceEndsAt, now) !== 'FULL') return 0;
  return subscription.plan.monthlyPriceCents;
}

// organizationId → MRR in cents; a missing organization means 0
export type TMrrByOrg = ReadonlyMap<string, number>;

export type TMrrMovements = {
  newCents: number;
  expansionCents: number;
  contractionCents: number;
  churnedCents: number;
  reactivationCents: number;
  netNewCents: number;
};

/**
 * Compares each organization's MRR at the start and end of a month (section 12.4 table).
 * `paidBefore(orgId)` = the organization had MRR at some time before this month; it tells
 * a reactivation from a new customer.
 */
export function mrrMovements(
  start: TMrrByOrg,
  end: TMrrByOrg,
  paidBefore: (organizationId: string) => boolean,
): TMrrMovements {
  const m = {
    newCents: 0,
    expansionCents: 0,
    contractionCents: 0,
    churnedCents: 0,
    reactivationCents: 0,
  };
  for (const id of new Set([...start.keys(), ...end.keys()])) {
    const before = start.get(id) ?? 0;
    const after = end.get(id) ?? 0;
    if (before === 0 && after > 0) {
      if (paidBefore(id)) m.reactivationCents += after;
      else m.newCents += after;
    } else if (before > 0 && after === 0) m.churnedCents += before;
    else if (after > before) m.expansionCents += after - before;
    else if (after < before) m.contractionCents += before - after;
  }
  return {
    ...m,
    netNewCents:
      m.newCents + m.expansionCents + m.reactivationCents - m.contractionCents - m.churnedCents,
  };
}

export const totalMrr = (mrr: TMrrByOrg) => [...mrr.values()].reduce((sum, c) => sum + c, 0);
export const payingCount = (mrr: TMrrByOrg) => [...mrr.values()].filter((c) => c > 0).length;

// Paying at the start of the month, not paying at its end
export const customersLost = (start: TMrrByOrg, end: TMrrByOrg) =>
  [...start].filter(([id, cents]) => cents > 0 && (end.get(id) ?? 0) === 0).length;

/** Customer churn rate = customers lost ÷ paying customers at the start (null if none) */
export const customerChurnRate = (start: TMrrByOrg, end: TMrrByOrg) => {
  const startCount = payingCount(start);
  return startCount === 0 ? null : customersLost(start, end) / startCount;
};

/** NRR = (start MRR + expansion − contraction − churned) ÷ start MRR (null if no start MRR) */
export const netRevenueRetention = (startMrrCents: number, m: TMrrMovements) =>
  startMrrCents === 0
    ? null
    : (startMrrCents + m.expansionCents - m.contractionCents - m.churnedCents) / startMrrCents;

/** ARPA = MRR ÷ paying organizations, in cents (null if none) */
export const arpaCents = (mrr: TMrrByOrg) => {
  const count = payingCount(mrr);
  return count === 0 ? null : totalMrr(mrr) / count;
};
