import type { SubscriptionStatus } from '../../generated/prisma/client';

export type AccessLevel = 'FULL' | 'FREE';

// SRS section 12.1: what a subscription status means for access right now
export function accessLevel(
  status: SubscriptionStatus,
  graceEndsAt: Date | null,
  now = new Date(),
): AccessLevel {
  switch (status) {
    case 'ACTIVE':
    case 'TRIALING':
      return 'FULL';
    case 'PAST_DUE':
      return graceEndsAt && now < graceEndsAt ? 'FULL' : 'FREE';
    default:
      return 'FREE'; // INCOMPLETE, UNPAID, CANCELED
  }
}
