import config from '../../config';
import AppError from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import { getStripe } from '../../lib/stripe';
import type { TenantPrisma } from '../../lib/tenantPrisma';

export const billingPageUrl = (slug: string, query = '') =>
  `${config.clientUrl}/${slug}/billing${query}`;

// Statuses that still hold a paid plan; a new checkout would create a second subscription
export const PAID_HOLDING_STATUSES = ['INCOMPLETE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'UNPAID'];

export async function getPurchasablePlan(code: string) {
  const plan = await prisma.plan.findUnique({ where: { code } });
  if (!plan?.isActive) throw new AppError(404, 'NOT_FOUND', 'Plan not found');
  if (!plan.stripePriceId || !plan.stripeMeteredPriceId) {
    throw new AppError(
      503,
      'BILLING_NOT_CONFIGURED',
      'This plan is not available for purchase yet. Please try again later.',
    );
  }
  return plan as typeof plan & { stripePriceId: string; stripeMeteredPriceId: string };
}

/**
 * Returns the organization's Stripe customer, creating it once. The id is saved right away
 * (not by a webhook), so abandoned checkouts never pile up duplicate customers.
 * Two simultaneous clicks send the same idempotency key with identical parameters (only
 * organization data, never the clicking user's), so Stripe returns one customer to both.
 */
export async function ensureStripeCustomer(
  db: TenantPrisma,
  org: { id: string; name: string; stripeCustomerId: string | null },
  billingEmail: string,
) {
  if (org.stripeCustomerId) return org.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create(
    { name: org.name, metadata: { organizationId: org.id } },
    { idempotencyKey: `ledgerflow-customer-${org.id}` },
  );

  const { count } = await db.organization.updateMany({
    where: { id: org.id, stripeCustomerId: null },
    data: { stripeCustomerId: customer.id },
  });
  if (count === 0) {
    // Another request saved it first: use theirs
    const saved = await db.organization.findUniqueOrThrow({
      where: { id: org.id },
      select: { stripeCustomerId: true },
    });
    return saved.stripeCustomerId!;
  }

  // Only the request that linked the customer sets the receipt email (editable in the portal)
  await stripe.customers.update(customer.id, { email: billingEmail });
  return customer.id;
}
