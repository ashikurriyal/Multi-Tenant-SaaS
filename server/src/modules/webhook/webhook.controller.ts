import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import config from '../../config';
import { runInBackground } from '../../lib/background';
import { getStripe, type Stripe } from '../../lib/stripe';
import catchAsync from '../../utils/catchAsync';
import { processStripeEvent, storeStripeEvent } from './webhook.processor';

const reject = (res: Response, statusCode: number, errorCode: string, message: string) =>
  res.status(statusCode).json({ success: false, statusCode, message, errorCode, errorDetails: [] });

/**
 * POST /api/v1/webhooks/stripe (FR-WH-01…04). Order matters:
 * 1. verify the signature on the raw bytes → 400 if it doesn't match (Stripe stops retrying)
 * 2. store the event (its id is the primary key, so a re-delivery is ignored)
 * 3. answer 200 right away — Stripe only needs to know we have it
 * 4. process it after the response; failures are retried by the retry-webhooks job
 */
const handleStripe = catchAsync(async (req: Request, res: Response) => {
  if (!config.stripe.webhookSecret || !config.stripe.secretKey) {
    // 503 makes Stripe try again later instead of dropping the event
    return reject(
      res,
      httpStatus.SERVICE_UNAVAILABLE,
      'BILLING_NOT_CONFIGURED',
      'Webhooks are not configured',
    );
  }

  const signature = req.get('stripe-signature');
  if (!signature || !Buffer.isBuffer(req.body)) {
    return reject(res, httpStatus.BAD_REQUEST, 'INVALID_SIGNATURE', 'Missing Stripe signature');
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, signature, config.stripe.webhookSecret);
  } catch {
    return reject(res, httpStatus.BAD_REQUEST, 'INVALID_SIGNATURE', 'Invalid Stripe signature');
  }

  const isNew = await storeStripeEvent(event);
  res.status(httpStatus.OK).json({ received: true, duplicate: !isNew });

  if (isNew) runInBackground(`webhook ${event.type}`, () => processStripeEvent(event.id));
});

export const WebhookController = { handleStripe };
