import type { Prisma, SubscriptionStatus } from '../../../generated/prisma/client';
import config from '../../config';
import { prisma } from '../../lib/prisma';
import { getStripe } from '../../lib/stripe';
import { recordAudit } from '../../shared/audit';
import { fromStripeInvoiceStatus, fromStripeStatus } from '../../shared/subscriptionState';
import { queueEmail } from '../email/email.outbox';
import type { EmailTemplate } from '../email/email.templates';
import { billingPageUrl } from './billing.utils';

/**
 * Keeps LedgerFlow's billing tables in line with Stripe (SRS 12.1, 12.2, 16.5).
 * Every function re-fetches the object from Stripe (FR-WH-05): the event only says
 * "look again", so late, repeated and out-of-order events all end in the current state.
 * Objects that don't belong to a LedgerFlow organization are ignored.
 */

type TTx = Prisma.TransactionClient;
const DAY_MS = 24 * 60 * 60 * 1000;
const toDate = (seconds: number | null | undefined) => (seconds ? new Date(seconds * 1000) : null);
const idOf = (value: string | { id: string } | null | undefined) =>
  typeof value === 'string' ? value : (value?.id ?? null);

// Metadata first (set by our checkout), then the customer we saved on the organization
async function resolveOrganization(
  metadataOrgId: string | null | undefined,
  customerId: string | null,
) {
  if (metadataOrgId) {
    const org = await prisma.organization.findUnique({ where: { id: metadataOrgId } });
    if (org && (!org.stripeCustomerId || !customerId || org.stripeCustomerId === customerId)) {
      return org;
    }
  }
  if (customerId)
    return prisma.organization.findUnique({ where: { stripeCustomerId: customerId } });
  return null;
}

// Saves the customer from a completed checkout if the organization doesn't have one yet
export async function linkCustomer(organizationId: string, customerId: string) {
  await prisma.organization.updateMany({
    where: { id: organizationId, stripeCustomerId: null },
    data: { stripeCustomerId: customerId },
  });
}

// Owners and Billing members with a verified address receive billing emails
async function queueBillingEmail(
  tx: TTx,
  organization: { id: string; name: string; slug: string },
  template: EmailTemplate,
  planName: string,
  date: Date | null,
) {
  const recipients = await tx.membership.findMany({
    where: {
      organizationId: organization.id,
      role: { in: ['OWNER', 'BILLING'] },
      user: { emailVerifiedAt: { not: null }, status: 'ACTIVE' },
    },
    select: { user: { select: { email: true } } },
  });
  for (const { user } of recipients) {
    await queueEmail(tx, {
      organizationId: organization.id,
      toEmail: user.email,
      template,
      data: {
        organizationName: organization.name,
        planName,
        link: billingPageUrl(organization.slug),
        date: date?.toISOString() ?? null,
      },
    });
  }
}

/**
 * Re-fetches a subscription and writes it to the organization's row (one per organization).
 * Locked per organization so concurrent events can't interleave. Audits plan and status
 * changes and queues the billing emails that a status change calls for.
 */
export async function syncSubscription(subscriptionId: string) {
  const sub = await getStripe().subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price'],
  });
  const customerId = idOf(sub.customer);
  const organization = await resolveOrganization(sub.metadata?.organizationId, customerId);
  if (!organization) {
    console.info(`[stripe-sync] ignored subscription ${sub.id}: no LedgerFlow organization`);
    return;
  }

  // The flat (licensed) item decides the plan; the metered item only carries overage
  const flat = sub.items.data.find((item) => item.price.recurring?.usage_type !== 'metered');
  const plan = flat
    ? await prisma.plan.findUnique({ where: { stripePriceId: flat.price.id } })
    : null;
  if (!flat || !plan) {
    throw new Error(`Subscription ${sub.id} has no price that matches a LedgerFlow plan`);
  }

  const status = fromStripeStatus(sub.status);
  const now = new Date();
  // Stripe API 2025+: period dates live on the subscription item
  const periodStart = toDate(flat.current_period_start) ?? now;
  const periodEnd = toDate(flat.current_period_end) ?? now;
  const cancelAtPeriodEnd =
    status !== 'CANCELED' && (sub.cancel_at_period_end || sub.cancel_at !== null);

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM subscriptions WHERE "organizationId" = ${organization.id} FOR UPDATE`;
    const before = await tx.subscription.findUnique({
      where: { organizationId: organization.id },
      include: { plan: { select: { code: true, name: true } } },
    });

    // A late event about an older, ended subscription must not undo the current one
    if (
      before?.stripeSubscriptionId &&
      before.stripeSubscriptionId !== sub.id &&
      status === 'CANCELED'
    ) {
      return;
    }

    // Grace starts once per past-due episode and is kept while it lasts (SRS 12.3)
    const graceEndsAt: Date | null =
      status !== 'PAST_DUE'
        ? null
        : before?.status === 'PAST_DUE' && before.graceEndsAt
          ? before.graceEndsAt
          : new Date(now.getTime() + config.gracePeriodDays * DAY_MS);

    const data = {
      planId: plan.id,
      stripeSubscriptionId: sub.id,
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd,
      trialEndsAt: toDate(sub.trial_end),
      graceEndsAt,
    };
    await tx.subscription.upsert({
      where: { organizationId: organization.id },
      create: { organizationId: organization.id, ...data },
      update: data,
    });

    const prevStatus: SubscriptionStatus | null = before?.status ?? null;
    if (before && before.planId !== plan.id) {
      await recordAudit(tx, {
        organizationId: organization.id,
        actorId: null, // Stripe-driven (FR-BILL-09)
        action: 'plan.changed',
        entityType: 'Subscription',
        entityId: before.id,
        before: { planCode: before.plan.code },
        after: { planCode: plan.code },
      });
    }
    if (prevStatus !== status || before?.cancelAtPeriodEnd !== cancelAtPeriodEnd) {
      await recordAudit(tx, {
        organizationId: organization.id,
        actorId: null,
        action: 'subscription.status_changed',
        entityType: 'Subscription',
        entityId: before?.id ?? sub.id,
        before: before
          ? { status: before.status, cancelAtPeriodEnd: before.cancelAtPeriodEnd }
          : undefined,
        after: { status, cancelAtPeriodEnd, stripeSubscriptionId: sub.id },
      });
    }

    // Emails follow status changes, so a repeated event never sends a second email
    if (prevStatus !== status) {
      if (status === 'PAST_DUE') {
        await queueBillingEmail(tx, organization, 'payment_failed', plan.name, graceEndsAt);
      } else if (prevStatus === 'PAST_DUE' && (status === 'ACTIVE' || status === 'TRIALING')) {
        await queueBillingEmail(tx, organization, 'payment_recovered', plan.name, null);
      } else if (status === 'CANCELED') {
        await queueBillingEmail(tx, organization, 'subscription_canceled', plan.name, periodEnd);
      }
    }
  });
}

/** Re-fetches an invoice, upserts it by Stripe id, then syncs its subscription */
export async function syncInvoice(invoiceId: string) {
  const invoice = await getStripe().invoices.retrieve(invoiceId);
  const details = invoice.parent?.subscription_details;
  const stripeSubscriptionId = idOf(details?.subscription);
  const organization = await resolveOrganization(
    details?.metadata?.organizationId,
    idOf(invoice.customer),
  );
  if (!organization || !invoice.id) {
    console.info(`[stripe-sync] ignored invoice ${invoiceId}: no LedgerFlow organization`);
    return;
  }

  // Subscription invoices: the line items carry the service period
  const line = invoice.lines?.data[0];
  const localSubscription = stripeSubscriptionId
    ? await prisma.subscription.findFirst({
        where: { organizationId: organization.id, stripeSubscriptionId },
        select: { id: true },
      })
    : null;
  const data = {
    organizationId: organization.id,
    subscriptionId: localSubscription?.id ?? null,
    status: fromStripeInvoiceStatus(invoice.status),
    amountDueCents: invoice.amount_due,
    amountPaidCents: invoice.amount_paid,
    currency: invoice.currency,
    periodStart: toDate(line?.period?.start) ?? toDate(invoice.period_start)!,
    periodEnd: toDate(line?.period?.end) ?? toDate(invoice.period_end)!,
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    paidAt: toDate(invoice.status_transitions?.paid_at),
  };
  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: { stripeInvoiceId: invoice.id, ...data },
    update: data,
  });

  // The invoice's outcome changes the subscription's status (paid → active, failed → past due)
  if (stripeSubscriptionId) await syncSubscription(stripeSubscriptionId);
}

// customer.subscription.trial_will_end (about 3 days before the trial ends)
export async function queueTrialEndingEmail(subscriptionId: string) {
  const sub = await getStripe().subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price'],
  });
  const organization = await resolveOrganization(sub.metadata?.organizationId, idOf(sub.customer));
  if (!organization) return;
  const flat = sub.items.data.find((item) => item.price.recurring?.usage_type !== 'metered');
  const plan = flat
    ? await prisma.plan.findUnique({ where: { stripePriceId: flat.price.id } })
    : null;
  await prisma.$transaction((tx) =>
    queueBillingEmail(
      tx,
      organization,
      'trial_will_end',
      plan?.name ?? 'paid',
      toDate(sub.trial_end),
    ),
  );
}
