import {
  linkCustomer,
  queueTrialEndingEmail,
  syncInvoice,
  syncSubscription,
} from '../billing/billing.sync';
import type { Stripe } from '../../lib/stripe';

/**
 * One handler per Stripe event type LedgerFlow reacts to (SRS 12.2, FR-WH-08).
 * Handlers only take ids from the event and re-fetch from Stripe (FR-WH-05).
 */
type THandler = (event: Stripe.Event) => Promise<void>;

const idOf = (value: string | { id: string } | null | undefined) =>
  typeof value === 'string' ? value : (value?.id ?? null);

const onCheckoutCompleted: THandler = async (event) => {
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode !== 'subscription') return;
  const organizationId = session.metadata?.organizationId ?? session.client_reference_id;
  const customerId = idOf(session.customer);
  if (organizationId && customerId) await linkCustomer(organizationId, customerId);
  const subscriptionId = idOf(session.subscription);
  if (subscriptionId) await syncSubscription(subscriptionId);
};

const onSubscriptionChanged: THandler = async (event) => {
  await syncSubscription((event.data.object as Stripe.Subscription).id);
};

const onInvoice: THandler = async (event) => {
  const id = (event.data.object as Stripe.Invoice).id;
  if (id) await syncInvoice(id);
};

const onTrialWillEnd: THandler = async (event) => {
  await queueTrialEndingEmail((event.data.object as Stripe.Subscription).id);
};

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
  'checkout.session.completed': onCheckoutCompleted,
  'customer.subscription.created': onSubscriptionChanged,
  'customer.subscription.updated': onSubscriptionChanged,
  'customer.subscription.deleted': onSubscriptionChanged,
  'invoice.paid': onInvoice,
  'invoice.payment_failed': onInvoice,
  'customer.subscription.trial_will_end': onTrialWillEnd,
};

export const isHandled = (type: string): type is THandledEvent =>
  (HANDLED_EVENTS as readonly string[]).includes(type);
