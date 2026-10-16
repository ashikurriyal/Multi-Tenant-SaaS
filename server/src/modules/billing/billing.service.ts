import AppError from '../../errors/AppError';
import { getPortalConfigurationId, getStripe } from '../../lib/stripe';
import type { TenantPrisma } from '../../lib/tenantPrisma';
import { recordAudit } from '../../shared/audit';
import { accessLevel } from '../../shared/subscriptionState';
import {
  billingPageUrl,
  ensureStripeCustomer,
  getPurchasablePlan,
  PAID_HOLDING_STATUSES,
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

export const BillingService = { getSubscription, createCheckoutSession, createPortalSession };
