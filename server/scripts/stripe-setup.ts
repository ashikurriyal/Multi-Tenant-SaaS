/**
 * Creates (or finds) everything LedgerFlow needs in Stripe and links it to the plans table:
 *   - a Billing Meter for usage (event name STRIPE_METER_EVENT_NAME)
 *   - per paid plan: a Product, a flat monthly Price and a metered overage Price
 *   - the Customer Portal configuration (update card, invoices, cancel at period end)
 * The overage price is graduated: the plan's included units cost 0, the rest cost the
 * overage rate. So every usage event can be reported and Stripe bills only the excess.
 *
 * Safe to run again: everything is found by lookup key. If a plan's amounts changed, a new
 * Price takes over the lookup key and the old one is archived (Stripe prices are immutable).
 *
 *   npm run stripe:setup            (uses STRIPE_SECRET_KEY and DATABASE_URL from .env)
 */
import config from '../src/config';
import { prisma } from '../src/lib/prisma';
import { getStripe, PORTAL_CONFIG_METADATA, Stripe } from '../src/lib/stripe';

const CURRENCY = 'usd';

if (
  !config.stripe.secretKey?.startsWith('sk_test_') &&
  !config.stripe.secretKey?.startsWith('rk_test_')
) {
  console.error('Refusing to run: STRIPE_SECRET_KEY must be a test-mode key (sk_test_…).');
  process.exit(1);
}

const stripe = getStripe();
const lookupKey = (code: string, kind: 'monthly' | 'overage') =>
  `ledgerflow_${code.toLowerCase()}_${kind}`;

// Overage is stored in micros of a dollar; Stripe wants cents with decimals ($0.002 → "0.2")
const microsToCentsDecimal = (micros: number) => (micros / 10_000).toString();

async function ensureMeter() {
  const eventName = config.stripe.meterEventName;
  for await (const meter of stripe.billing.meters.list({ status: 'active', limit: 100 })) {
    if (meter.event_name === eventName) return { meter, created: false };
  }
  const meter = await stripe.billing.meters.create({
    display_name: 'LedgerFlow units',
    event_name: eventName,
    default_aggregation: { formula: 'sum' },
    // Usage events will carry the organization's Stripe customer id and a quantity
    customer_mapping: { type: 'by_id', event_payload_key: 'stripe_customer_id' },
    value_settings: { event_payload_key: 'value' },
  });
  return { meter, created: true };
}

async function findPrice(key: string) {
  const { data } = await stripe.prices.list({
    lookup_keys: [key],
    active: true,
    expand: ['data.tiers', 'data.product'],
    limit: 1,
  });
  return data[0];
}

type TPriceOutcome = 'kept' | 'created' | 'replaced';

/** Keeps the price behind `key` if it still matches, otherwise creates one and archives the old */
async function ensurePrice(
  key: string,
  matches: (price: Stripe.Price) => boolean,
  create: () => Stripe.PriceCreateParams,
): Promise<{ price: Stripe.Price; outcome: TPriceOutcome }> {
  const existing = await findPrice(key);
  if (existing && matches(existing)) return { price: existing, outcome: 'kept' };

  const price = await stripe.prices.create({
    ...create(),
    lookup_key: key,
    transfer_lookup_key: true,
  });
  if (existing) await stripe.prices.update(existing.id, { active: false });
  return { price, outcome: existing ? 'replaced' : 'created' };
}

async function ensureProduct(plan: { code: string; name: string }, existing?: Stripe.Price) {
  const name = `LedgerFlow ${plan.name}`;
  const current = existing?.product as Stripe.Product | undefined;
  if (current && !current.deleted) {
    if (current.name !== name) await stripe.products.update(current.id, { name });
    return current.id;
  }
  const product = await stripe.products.create({
    name,
    metadata: { ledgerflow_plan: plan.code },
  });
  return product.id;
}

// FR-BILL-07. Plan changes go through LedgerFlow (preview + seat checks), not the portal
const portalFeatures: Stripe.BillingPortal.ConfigurationCreateParams.Features = {
  payment_method_update: { enabled: true },
  invoice_history: { enabled: true },
  customer_update: { enabled: true, allowed_updates: ['email', 'name', 'address'] },
  subscription_cancel: { enabled: true, mode: 'at_period_end', proration_behavior: 'none' },
  subscription_update: { enabled: false },
};

async function ensurePortalConfiguration() {
  for await (const configuration of stripe.billingPortal.configurations.list({
    active: true,
    limit: 100,
  })) {
    if (configuration.metadata?.ledgerflow === PORTAL_CONFIG_METADATA.ledgerflow) {
      await stripe.billingPortal.configurations.update(configuration.id, {
        features: portalFeatures,
      });
      return { id: configuration.id, created: false };
    }
  }
  const configuration = await stripe.billingPortal.configurations.create({
    name: 'LedgerFlow',
    business_profile: { headline: 'Manage your LedgerFlow billing' },
    features: portalFeatures,
    metadata: PORTAL_CONFIG_METADATA,
  });
  return { id: configuration.id, created: true };
}

async function main() {
  const account = await stripe.accounts.retrieveCurrent();
  console.info(
    `Stripe account: ${account.settings?.dashboard?.display_name ?? account.id} (${account.id}), test mode`,
  );

  const { meter, created } = await ensureMeter();
  console.info(`Meter "${meter.event_name}": ${created ? 'created' : 'kept'} (${meter.id})`);

  const plans = await prisma.plan.findMany({
    where: { monthlyPriceCents: { gt: 0 } },
    orderBy: { monthlyPriceCents: 'asc' },
  });
  if (plans.length === 0)
    throw new Error('No paid plans in the database. Run `npm run db:seed` first.');

  for (const plan of plans) {
    const monthlyKey = lookupKey(plan.code, 'monthly');
    const overageKey = lookupKey(plan.code, 'overage');
    const productId = await ensureProduct(plan, await findPrice(monthlyKey));
    const overageCents = microsToCentsDecimal(plan.overageUnitMicros);

    const monthly = await ensurePrice(
      monthlyKey,
      (p) =>
        p.unit_amount === plan.monthlyPriceCents &&
        p.currency === CURRENCY &&
        p.recurring?.interval === 'month' &&
        p.recurring.usage_type === 'licensed',
      () => ({
        product: productId,
        currency: CURRENCY,
        unit_amount: plan.monthlyPriceCents,
        recurring: { interval: 'month', usage_type: 'licensed' },
        nickname: `${plan.name} monthly`,
      }),
    );

    const overage = await ensurePrice(
      overageKey,
      (p) =>
        p.recurring?.meter === meter.id &&
        p.tiers_mode === 'graduated' &&
        p.tiers?.[0]?.up_to === plan.includedUnits &&
        p.tiers[0].unit_amount === 0 &&
        p.tiers[1]?.up_to === null &&
        Number(p.tiers[1]?.unit_amount_decimal?.toString()) === Number(overageCents),
      () => ({
        product: productId,
        currency: CURRENCY,
        recurring: { interval: 'month', usage_type: 'metered', meter: meter.id },
        billing_scheme: 'tiered',
        tiers_mode: 'graduated',
        tiers: [
          { up_to: plan.includedUnits, unit_amount: 0 },
          { up_to: 'inf', unit_amount_decimal: Stripe.Decimal.from(overageCents) },
        ],
        nickname: `${plan.name} overage (first ${plan.includedUnits.toLocaleString('en-US')} included)`,
      }),
    );

    await prisma.plan.update({
      where: { code: plan.code },
      data: { stripePriceId: monthly.price.id, stripeMeteredPriceId: overage.price.id },
    });
    console.info(
      `${plan.code.padEnd(8)} monthly ${monthly.outcome.padEnd(8)} ${monthly.price.id} | ` +
        `overage ${overage.outcome.padEnd(8)} ${overage.price.id}`,
    );
  }
  console.info('Plans table updated with Stripe price ids.');

  const portal = await ensurePortalConfiguration();
  console.info(`Customer Portal: ${portal.created ? 'created' : 'updated'} (${portal.id})`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
