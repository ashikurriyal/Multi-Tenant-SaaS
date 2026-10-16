import AppError from '../../errors/AppError';
import { getPortalConfigurationId, getStripe } from '../../lib/stripe';
import type { TenantPrisma } from '../../lib/tenantPrisma';
import { recordAudit } from '../../shared/audit';
import { accessLevel } from '../../shared/subscriptionState';
import { countSeatsUsed } from '../../shared/entitlements';
import { buildMeta, toSkipTake, type TPagination } from '../../utils/pagination';
import {
  billingPageUrl,
  ensureStripeCustomer,
  getPurchasablePlan,
  PAID_HOLDING_STATUSES,
  splitSubscriptionItems,
  stripeNow,
  withIdempotentRetry,
} from './billing.utils';

type TActor = { id: string; email: string };

const orgSelect = { id: true, name: true, slug: true, stripeCustomerId: true } as const;

// FR-BILL-01
const getSubscription = async (db: TenantPrisma, organizationId: string) => {
  const [subscription, organization] = await Promise.all([
    db.subscription.findUniqueOrThrow({
      where: { organizationId },
      include: {
        plan: {
          select: {
            code: true,
            name: true,
            monthlyPriceCents: true,
            seatLimit: true,
            includedUnits: true,
            overageUnitMicros: true,
          },
        },
      },
    }),
    db.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { stripeCustomerId: true },
    }),
  ]);

  return {
    plan: subscription.plan,
    status: subscription.status,
    accessLevel: accessLevel(subscription.status, subscription.graceEndsAt),
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    trialEndsAt: subscription.trialEndsAt,
    graceEndsAt: subscription.graceEndsAt,
    isPaidPlan: subscription.plan.code !== 'FREE',
    // The Customer Portal needs a Stripe customer, which exists after the first checkout
    hasBillingAccount: Boolean(organization.stripeCustomerId),
  };
};

/**
 * FR-BILL-02. Sends the user to Stripe's hosted Checkout page. Nothing is activated here:
 * only the webhook that follows a successful payment changes the subscription (FR-BILL-03).
 */
const createCheckoutSession = async (
  db: TenantPrisma,
  organizationId: string,
  actor: TActor,
  planCode: string,
) => {
  const subscription = await db.subscription.findUniqueOrThrow({
    where: { organizationId },
    select: { stripeSubscriptionId: true, status: true },
  });
  if (subscription.stripeSubscriptionId && PAID_HOLDING_STATUSES.includes(subscription.status)) {
    throw new AppError(
      409,
      'ALREADY_SUBSCRIBED',
      'Your organization already has a paid plan. Change plans from the billing page instead.',
    );
  }

  const plan = await getPurchasablePlan(planCode);
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: orgSelect,
  });
  const customerId = await ensureStripeCustomer(db, organization, actor.email);

  // organizationId travels on the session and the subscription it creates, so every
  // webhook can be matched to the organization without trusting the browser
  const metadata = { organizationId, planCode: plan.code };
  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: organizationId,
    line_items: [
      { price: plan.stripePriceId, quantity: 1 },
      { price: plan.stripeMeteredPriceId }, // metered: billed from reported usage
    ],
    success_url: billingPageUrl(organization.slug, '?checkout=success'),
    cancel_url: billingPageUrl(organization.slug, '?checkout=canceled'),
    metadata,
    subscription_data: { metadata },
    billing_address_collection: 'auto',
  });
  if (!session.url) throw new Error('Stripe returned a Checkout Session without a URL');

  await recordAudit(db, {
    organizationId,
    actorId: actor.id,
    action: 'checkout.started',
    entityType: 'Organization',
    entityId: organizationId,
    after: { planCode: plan.code, checkoutSessionId: session.id },
  });

  return { url: session.url };
};

// FR-BILL-07: Stripe-hosted page to update the card, see invoices and cancel
const createPortalSession = async (db: TenantPrisma, organizationId: string) => {
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: orgSelect,
  });
  if (!organization.stripeCustomerId) {
    throw new AppError(
      409,
      'NO_BILLING_ACCOUNT',
      'There is no billing account yet. Choose a paid plan first.',
    );
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: organization.stripeCustomerId,
    configuration: await getPortalConfigurationId(),
    return_url: billingPageUrl(organization.slug),
  });
  return { url: session.url };
};

// Plan changes need a paid subscription in good standing (FR-BILL-04…06)
async function loadChangeablePlan(db: TenantPrisma, organizationId: string, planCode: string) {
  const subscription = await db.subscription.findUniqueOrThrow({
    where: { organizationId },
    include: { plan: true },
  });
  if (!subscription.stripeSubscriptionId || !['ACTIVE', 'TRIALING'].includes(subscription.status)) {
    throw new AppError(
      409,
      subscription.status === 'PAST_DUE' ? 'PAYMENT_FAILED' : 'NOT_SUBSCRIBED',
      subscription.status === 'PAST_DUE'
        ? 'Your last payment failed. Update the payment method before changing plans.'
        : 'There is no active paid plan to change. Choose a plan to subscribe instead.',
    );
  }
  if (subscription.plan.code === planCode) {
    throw new AppError(409, 'CONFLICT', `You are already on the ${subscription.plan.name} plan.`);
  }

  const target = await getPurchasablePlan(planCode);

  // FR-BILL-06: a smaller plan must fit everyone already in the organization
  if (target.seatLimit < subscription.plan.seatLimit) {
    const seatsUsed = await countSeatsUsed(organizationId);
    if (seatsUsed > target.seatLimit) {
      throw new AppError(
        409,
        'SEATS_EXCEED_TARGET_PLAN',
        `${target.name} allows ${target.seatLimit} seats, but ${seatsUsed} are in use (members and pending invitations). Remove some first.`,
      );
    }
  }

  const stripeSub = await getStripe().subscriptions.retrieve(subscription.stripeSubscriptionId, {
    expand: ['items.data.price'],
  });
  const { flat, metered } = splitSubscriptionItems(stripeSub.items.data);
  // Swap both prices in place; a missing metered item (older subscriptions) is added
  const items = [
    { id: flat.id, price: target.stripePriceId },
    metered
      ? { id: metered.id, price: target.stripeMeteredPriceId }
      : { price: target.stripeMeteredPriceId },
  ];
  return { subscription, target, stripeSub, items };
}

/**
 * FR-BILL-04: what changing now would cost. `amountDueNowCents` is the prorated charge
 * (negative = credit kept on the account for the next invoices). The returned
 * `prorationDate` is sent back with the change so the charge matches this preview.
 */
const previewPlanChange = async (db: TenantPrisma, organizationId: string, planCode: string) => {
  const { subscription, target, stripeSub, items } = await loadChangeablePlan(
    db,
    organizationId,
    planCode,
  );
  const prorationDate = await stripeNow(stripeSub);
  const preview = await getStripe().invoices.createPreview({
    customer: typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer.id,
    subscription: stripeSub.id,
    subscription_details: {
      items,
      proration_behavior: 'always_invoice',
      proration_date: prorationDate,
    },
  });

  return {
    currentPlan: { code: subscription.plan.code, name: subscription.plan.name },
    targetPlan: {
      code: target.code,
      name: target.name,
      monthlyPriceCents: target.monthlyPriceCents,
    },
    isUpgrade: target.monthlyPriceCents > subscription.plan.monthlyPriceCents,
    amountDueNowCents: preview.total,
    currency: preview.currency,
    // From the next period on: the new plan's monthly price, plus any overage
    nextMonthlyCents: target.monthlyPriceCents,
    prorationDate,
  };
};

/**
 * FR-BILL-05. Changes the Stripe subscription with proration, charged right away. The
 * Idempotency-Key makes a double-clicked "Confirm" a single change in Stripe. A declined
 * card leaves everything unchanged (402). Our database changes only when the
 * customer.subscription.updated webhook arrives.
 */
const changePlan = async (
  db: TenantPrisma,
  organizationId: string,
  actor: TActor,
  input: { planCode: string; prorationDate?: number; idempotencyKey: string },
) => {
  const { subscription, target, stripeSub, items } = await loadChangeablePlan(
    db,
    organizationId,
    input.planCode,
  );
  // A preview older than an hour (or from the future) is stale: charge from now instead
  const now = await stripeNow(stripeSub);
  const age = input.prorationDate ? now - input.prorationDate : Infinity;
  const fresh = age >= 0 && age < 3600 ? input.prorationDate : undefined;

  await withIdempotentRetry(() =>
    getStripe().subscriptions.update(
      stripeSub.id,
      {
        items,
        proration_behavior: 'always_invoice',
        ...(fresh && { proration_date: fresh }),
        payment_behavior: 'error_if_incomplete',
        metadata: { organizationId, planCode: target.code },
      },
      { idempotencyKey: `ledgerflow-change-plan-${organizationId}-${input.idempotencyKey}` },
    ),
  );

  await recordAudit(db, {
    organizationId,
    actorId: actor.id,
    action: 'plan.change_requested',
    entityType: 'Subscription',
    entityId: subscription.id,
    before: { planCode: subscription.plan.code },
    after: { planCode: target.code },
  });

  return { planCode: target.code, status: 'pending' as const };
};

// FR-BILL-08: newest first, from our copy (kept current by invoice webhooks)
const listInvoices = async (db: TenantPrisma, pagination: TPagination) => {
  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      ...toSkipTake(pagination),
      orderBy: [{ periodStart: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        status: true,
        amountDueCents: true,
        amountPaidCents: true,
        currency: true,
        periodStart: true,
        periodEnd: true,
        paidAt: true,
        hostedInvoiceUrl: true,
        createdAt: true,
      },
    }),
    db.invoice.count(),
  ]);
  return { data: invoices, meta: buildMeta(pagination, total) };
};

export const BillingService = {
  getSubscription,
  createCheckoutSession,
  createPortalSession,
  previewPlanChange,
  changePlan,
  listInvoices,
};
