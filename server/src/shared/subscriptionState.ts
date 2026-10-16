import type { InvoiceStatus, SubscriptionStatus } from '../../generated/prisma/client';

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

// SRS section 12.1: Stripe's subscription status → LedgerFlow's
export function fromStripeStatus(status: string): SubscriptionStatus {
  switch (status) {
    case 'incomplete':
      return 'INCOMPLETE';
    case 'trialing':
      return 'TRIALING';
    case 'active':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'unpaid':
    case 'paused':
      return 'UNPAID';
    case 'canceled':
    case 'incomplete_expired':
      return 'CANCELED';
    default:
      // A status Stripe adds later: treat as no paid access until mapped deliberately
      return 'UNPAID';
  }
}

export function fromStripeInvoiceStatus(status: string | null): InvoiceStatus {
  switch (status) {
    case 'paid':
      return 'PAID';
    case 'uncollectible':
      return 'UNCOLLECTIBLE';
    case 'void':
      return 'VOID';
    case 'draft':
      return 'DRAFT';
    default:
      return 'OPEN';
  }
}
