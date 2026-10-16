import { prisma } from '../lib/prisma';
import { getStripe } from '../lib/stripe';
import { syncSubscription } from '../modules/billing/billing.sync';
import { recordAudit } from '../shared/audit';
import type { JobResult } from './registry';

const COMPARED = [
  'stripeSubscriptionId',
  'planId',
  'status',
  'cancelAtPeriodEnd',
  'currentPeriodEnd',
  'trialEndsAt',
] as const;

type TSnapshot = Partial<Record<(typeof COMPARED)[number], unknown>>;

const snapshot = async (organizationId: string): Promise<TSnapshot> => {
  const row = await prisma.subscription.findUnique({ where: { organizationId } });
  if (!row) return {};
  return Object.fromEntries(
    COMPARED.map((key) => [
      key,
      row[key] instanceof Date ? (row[key] as Date).toISOString() : row[key],
    ]),
  );
};

/**
 * FR-WH-09, daily. Webhooks can be missed (endpoint down for days, events past their
 * retries), so Stripe is asked directly: every organization with a Stripe customer is
 * re-synced, and any difference that had to be corrected is audited as
 * `reconciliation.corrected`. It also finds subscriptions whose webhooks never arrived.
 * Safe to run twice: syncing an organization that is already right changes nothing.
 */
export async function reconcileStripe(): Promise<JobResult> {
  const stripe = getStripe();
  const organizations = await prisma.organization.findMany({
    where: { stripeCustomerId: { not: null } },
    select: {
      id: true,
      stripeCustomerId: true,
      subscription: { select: { stripeSubscriptionId: true } },
    },
  });

  let checked = 0;
  let corrected = 0;
  let errors = 0;
  for (const org of organizations) {
    try {
      let subscriptionId = org.subscription?.stripeSubscriptionId ?? null;
      if (!subscriptionId) {
        // No subscription linked: did one get created whose webhooks we never saw?
        const { data } = await stripe.subscriptions.list({
          customer: org.stripeCustomerId!,
          status: 'all',
          limit: 5,
        });
        const current = data.find(
          (s) => s.status !== 'canceled' && s.status !== 'incomplete_expired',
        );
        subscriptionId = current?.id ?? null;
      }
      if (!subscriptionId) continue;

      checked++;
      const before = await snapshot(org.id);
      await syncSubscription(subscriptionId);
      const after = await snapshot(org.id);

      const changed = COMPARED.filter((key) => before[key] !== after[key]);
      if (changed.length > 0) {
        corrected++;
        await recordAudit(prisma, {
          organizationId: org.id,
          actorId: null,
          action: 'reconciliation.corrected',
          entityType: 'Subscription',
          entityId: subscriptionId,
          before: Object.fromEntries(changed.map((k) => [k, before[k] ?? null])),
          after: Object.fromEntries(changed.map((k) => [k, after[k] ?? null])),
        });
      }
    } catch (err) {
      errors++;
      console.error(`[reconcile-stripe] organization ${org.id}: ${String(err)}`);
    }
  }

  const result = { organizations: organizations.length, checked, corrected, errors };
  console.info('[reconcile-stripe]', JSON.stringify(result));
  return result;
}
