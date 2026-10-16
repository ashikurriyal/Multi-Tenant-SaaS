import type { Stripe } from '../../lib/stripe';

/**
 * One handler per Stripe event type LedgerFlow reacts to (SRS 12.2, FR-WH-08).
 * Handlers re-fetch the object from Stripe instead of trusting the payload (FR-WH-05),
 * so events that arrive late, twice or out of order still end in the right state.
 * They are filled in by the subscription-sync step; for now each event is recorded.
 */
type THandler = (event: Stripe.Event) => Promise<void>;

const recordOnly: THandler = async () => {};

export const HANDLED_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
  'customer.subscription.trial_will_end',
] as const;

export type THandledEvent = (typeof HANDLED_EVENTS)[number];

export const handlers: Record<THandledEvent, THandler> = {
  'checkout.session.completed': recordOnly,
  'customer.subscription.created': recordOnly,
  'customer.subscription.updated': recordOnly,
  'customer.subscription.deleted': recordOnly,
  'invoice.paid': recordOnly,
  'invoice.payment_failed': recordOnly,
  'customer.subscription.trial_will_end': recordOnly,
};

export const isHandled = (type: string): type is THandledEvent =>
  (HANDLED_EVENTS as readonly string[]).includes(type);
