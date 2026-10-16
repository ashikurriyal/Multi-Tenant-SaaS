import type { Prisma } from '../../../generated/prisma/client';
import { sendEmails } from '../../jobs/sendEmails';
import { prisma } from '../../lib/prisma';
import type { Stripe } from '../../lib/stripe';
import { handlers, isHandled } from './stripe.handlers';

export const MAX_ATTEMPTS = 5; // FR-WH-07
// A PROCESSING row older than this belongs to a worker that crashed or timed out
export const STALE_PROCESSING_MS = 10 * 60 * 1000;

// 2, 4, 8, 16 minutes after attempts 1–4 (FR-WH-07)
const backoff = (attempts: number) => new Date(Date.now() + 2 ** attempts * 60_000);

export type TProcessOutcome = 'processed' | 'failed' | 'skipped';

/**
 * Processes one stored event exactly once. The claim is atomic: whoever moves the row to
 * PROCESSING first does the work; the request that stored it, the retry job and a second
 * instance can all call this at the same moment safely. Never throws — failures are
 * recorded on the row and retried by the retry-webhooks job.
 */
export async function processStripeEvent(eventId: string): Promise<TProcessOutcome> {
  const claimed = await prisma.stripeEvent.updateMany({
    where: {
      id: eventId,
      attempts: { lt: MAX_ATTEMPTS },
      OR: [
        { status: 'RECEIVED' },
        { status: 'FAILED', OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }] },
      ],
    },
    data: { status: 'PROCESSING', attempts: { increment: 1 } },
  });
  if (claimed.count === 0) return 'skipped';

  const row = await prisma.stripeEvent.findUniqueOrThrow({ where: { id: eventId } });
  try {
    const event = row.payload as unknown as Stripe.Event;
    // Other event types are kept for the record and marked processed (FR-WH-08)
    if (isHandled(event.type)) await handlers[event.type](event);

    await prisma.stripeEvent.update({
      where: { id: eventId },
      data: { status: 'PROCESSED', processedAt: new Date(), lastError: null, nextAttemptAt: null },
    });
    // Billing emails queued by the handler go out now (one query when there are none)
    await sendEmails().catch((err) => console.error('[webhook] sending emails failed:', err));
    return 'processed';
  } catch (err) {
    const giveUp = row.attempts >= MAX_ATTEMPTS;
    await prisma.stripeEvent.update({
      where: { id: eventId },
      data: {
        status: 'FAILED',
        lastError: (err instanceof Error ? err.message : String(err)).slice(0, 500),
        // No next attempt once the limit is reached: it stays FAILED for the admin page
        nextAttemptAt: giveUp ? null : backoff(row.attempts),
      },
    });
    console.error(
      `[webhook] ${row.type} ${eventId} failed (attempt ${row.attempts}): ${String(err)}`,
    );
    return 'failed';
  }
}

// Stores a verified event. Returns false when Stripe already delivered it (dedupe, FR-WH-03)
export async function storeStripeEvent(event: Stripe.Event): Promise<boolean> {
  try {
    await prisma.stripeEvent.create({
      data: {
        id: event.id,
        type: event.type,
        payload: event as unknown as Prisma.InputJsonValue,
      },
    });
    return true;
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') return false;
    throw err;
  }
}
