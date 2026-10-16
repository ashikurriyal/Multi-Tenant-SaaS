import Stripe from 'stripe';
import config from '../config';

// Pinned so Stripe can't change response shapes under us (e.g. where period dates live).
// Upgrading is a deliberate change: bump this, read Stripe's changelog, run the billing tests.
export const STRIPE_API_VERSION = '2026-09-30.endive' as const;

let client: Stripe | null = null;

/**
 * The one Stripe client. Created on first use, so the API still starts (and CI still runs)
 * without a key; anything that actually needs Stripe fails clearly instead.
 */
export function getStripe(): Stripe {
  if (!config.stripe.secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set; billing is unavailable');
  }
  client ??= new Stripe(config.stripe.secretKey, {
    apiVersion: STRIPE_API_VERSION,
    appInfo: { name: 'LedgerFlow' },
    maxNetworkRetries: 2,
  });
  return client;
}

export { Stripe };
