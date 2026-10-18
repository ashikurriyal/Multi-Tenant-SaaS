import config from '../config';
import { prisma } from '../lib/prisma';
import { getStripe, Stripe } from '../lib/stripe';
import type { JobResult } from './registry';

const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 500;
// Stripe's test mode allows about 25 requests per second; stay well under it
const PARALLEL = 10;
// Stripe rejects meter events older than 35 days; leave a margin for slow runs
const MAX_AGE_MS = 33 * DAY_MS;

// Unique per database too: development and production share one Stripe test account,
// and both number their events from 1
const identifierFor = (organizationId: string, eventId: bigint) =>
  `lf-${organizationId}-${eventId}`;

// Stripe answers a repeated identifier with a 400 that has no error code, only this message
const isAlreadyReported = (err: unknown) =>
  err instanceof Stripe.errors.StripeInvalidRequestError &&
  /already exists with identifier/i.test(err.message);

/**
 * SRS section 13. Sends billable usage events (recorded while the organization had a paid
 * subscription) to the Stripe Billing Meter. Every unit is reported; the graduated overage
 * price makes the plan's included units free, so Stripe bills only the excess (FR-PLAN-03).
 *
 * Safe to run twice, even concurrently: the meter event's identifier is derived from the
 * usage event, and Stripe refuses a second event with the same identifier, which counts as
 * reported here. Rows are marked after each small group, so a crash re-sends at most one
 * group, and Stripe ignores those.
 */
export async function reportUsage(): Promise<JobResult> {
  if (!config.stripe.secretKey) return { skipped: 'STRIPE_SECRET_KEY is not set' };
  const stripe = getStripe();

  const events = await prisma.usageEvent.findMany({
    where: {
      billable: true,
      reportedToStripeAt: null,
      createdAt: { gte: new Date(Date.now() - MAX_AGE_MS) },
    },
    orderBy: { id: 'asc' },
    take: BATCH_SIZE,
    select: {
      id: true,
      organizationId: true,
      quantity: true,
      occurredAt: true,
      periodStart: true,
      organization: { select: { stripeCustomerId: true } },
    },
  });

  let sent = 0;
  let alreadyReported = 0;
  let failed = 0;

  for (let i = 0; i < events.length; i += PARALLEL) {
    const group = events.slice(i, i + PARALLEL);
    const outcomes = await Promise.all(
      group.map(async (event) => {
        const customer = event.organization.stripeCustomerId;
        if (!customer) return 'failed' as const;
        try {
          await stripe.billing.meterEvents.create({
            event_name: config.stripe.meterEventName,
            payload: { stripe_customer_id: customer, value: String(event.quantity) },
            identifier: identifierFor(event.organizationId, event.id),
            // Stripe bills by timestamp: never before the period the counter put it in, so
            // Stripe's period and LedgerFlow's agree (occurredAt may be up to 24 h earlier)
            timestamp: Math.floor(
              Math.max(event.occurredAt.getTime(), event.periodStart.getTime()) / 1000,
            ),
          });
          return 'sent' as const;
        } catch (err) {
          if (isAlreadyReported(err)) return 'already' as const;
          console.error(
            `[report-usage] event ${event.id}: ${err instanceof Error ? err.message : err}`,
          );
          return 'failed' as const;
        }
      }),
    );

    const done = group.filter((_, j) => outcomes[j] !== 'failed').map((event) => event.id);
    if (done.length > 0) {
      await prisma.usageEvent.updateMany({
        where: { id: { in: done }, reportedToStripeAt: null },
        data: { reportedToStripeAt: new Date() },
      });
    }
    sent += outcomes.filter((o) => o === 'sent').length;
    alreadyReported += outcomes.filter((o) => o === 'already').length;
    failed += outcomes.filter((o) => o === 'failed').length;
  }

  const result = { found: events.length, sent, alreadyReported, failed };
  console.info('[report-usage]', JSON.stringify(result));
  return result;
}
