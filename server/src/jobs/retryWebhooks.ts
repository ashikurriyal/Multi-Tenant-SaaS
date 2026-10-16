import { prisma } from '../lib/prisma';
import {
  MAX_ATTEMPTS,
  processStripeEvent,
  STALE_PROCESSING_MS,
} from '../modules/webhook/webhook.processor';
import type { JobResult } from './registry';

const BATCH_SIZE = 25;
// Fresh RECEIVED events are being processed by the request that stored them
const RECEIVED_GRACE_MS = 60 * 1000;

/**
 * SRS section 13 (FR-WH-07). Processes events that are waiting: RECEIVED ones the request
 * didn't finish, and FAILED ones whose backoff is over. PROCESSING rows stuck for 10 minutes
 * (crashed worker, timed-out function) go back to FAILED first so they're retried.
 * Safe to run concurrently: processStripeEvent claims each event atomically.
 */
export async function retryWebhooks(): Promise<JobResult> {
  const now = Date.now();

  const stale = await prisma.stripeEvent.updateMany({
    where: { status: 'PROCESSING', updatedAt: { lt: new Date(now - STALE_PROCESSING_MS) } },
    data: {
      status: 'FAILED',
      lastError: 'Processing did not finish (timed out)',
      nextAttemptAt: new Date(now),
    },
  });

  const due = await prisma.stripeEvent.findMany({
    where: {
      attempts: { lt: MAX_ATTEMPTS },
      OR: [
        { status: 'RECEIVED', receivedAt: { lt: new Date(now - RECEIVED_GRACE_MS) } },
        { status: 'FAILED', nextAttemptAt: { lte: new Date(now) } },
      ],
    },
    orderBy: { receivedAt: 'asc' }, // oldest first, so Stripe's order is roughly kept
    take: BATCH_SIZE,
    select: { id: true },
  });

  const counts = { processed: 0, failed: 0, skipped: 0 };
  for (const { id } of due) counts[await processStripeEvent(id)]++;

  if (due.length > 0 || stale.count > 0) {
    console.info(`[retry-webhooks] ${JSON.stringify({ stale: stale.count, ...counts })}`);
  }
  return { stale: stale.count, ...counts };
}
