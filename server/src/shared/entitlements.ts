import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { accessLevel, type AccessLevel } from './subscriptionState';

export type Entitlements = {
  planCode: string;
  status: string;
  accessLevel: AccessLevel;
  seatLimit: number;
  seatsUsed: number;
  includedUnits: number;
  overageAllowed: boolean;
};

type TSeatClient = Pick<Prisma.TransactionClient, 'membership' | 'invitation'>;

// Pending = not accepted and not expired; they hold a seat until then.
// Pass a transaction client to count inside a locked transaction.
export const countSeatsUsed = async (
  organizationId: string,
  now = new Date(),
  db: TSeatClient = prisma,
) => {
  const [members, pendingInvites] = await Promise.all([
    db.membership.count({ where: { organizationId } }),
    db.invitation.count({
      where: { organizationId, acceptedAt: null, expiresAt: { gt: now } },
    }),
  ]);
  return members + pendingInvites;
};

/**
 * SRS section 12.3 — the one place that decides what an organization may do.
 * When access drops to FREE, the Free plan's limits apply whatever plan is attached.
 */
export async function getEntitlements(organizationId: string, now = new Date()) {
  const [subscription, freePlan, seatsUsed] = await Promise.all([
    prisma.subscription.findUnique({ where: { organizationId }, include: { plan: true } }),
    prisma.plan.findUnique({ where: { code: 'FREE' } }),
    countSeatsUsed(organizationId, now),
  ]);
  if (!freePlan) throw new Error('FREE plan is missing, run the seed');

  const level = subscription
    ? accessLevel(subscription.status, subscription.graceEndsAt, now)
    : 'FREE';
  const limits = level === 'FULL' && subscription ? subscription.plan : freePlan;

  return {
    planCode: subscription?.plan.code ?? freePlan.code,
    status: subscription?.status ?? 'ACTIVE',
    accessLevel: level,
    seatLimit: limits.seatLimit,
    seatsUsed,
    includedUnits: limits.includedUnits,
    overageAllowed: level === 'FULL' && limits.overageUnitMicros > 0,
  } satisfies Entitlements;
}
