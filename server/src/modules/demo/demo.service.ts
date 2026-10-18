import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import type { Plan, Prisma } from '../../../generated/prisma/client';
import config from '../../config';
import { prisma } from '../../lib/prisma';
import { getStripe, Stripe } from '../../lib/stripe';
import { tenantPrisma } from '../../lib/tenantPrisma';
import { generateApiKey } from '../apiKey/apiKey.utils';
import { syncSubscription } from '../billing/billing.sync';
import { currentFreePeriod } from '../organization/organization.utils';
import { getUsageContext } from '../usage/usage.utils';
import {
  allDemoEmails,
  DEMO_ACCOUNTS,
  DEMO_EXTRA_MEMBERS,
  DEMO_ORGS,
  DEMO_TENANT_SLUGS,
  type DemoOrgKey,
} from './demo.config';

const DAY_S = 24 * 60 * 60;
const DAY_MS = DAY_S * 1000;
const USAGE_HISTORY_DAYS = 90;
const MAX_EVENT_QUANTITY = 10_000; // same cap as the usage API (FR-USE-02)
const METRICS = [
  ['documents_processed', 0.65],
  ['pages_ocr', 0.25],
  ['api_calls', 0.1],
] as const;

type TDemoOrg = { key: DemoOrgKey; id: string; name: string; ownerId: string; apiKeyId: string };

const isMissing = (err: unknown) =>
  err instanceof Stripe.errors.StripeInvalidRequestError && err.code === 'resource_missing';

/**
 * Deletes a previous demo organization's Stripe objects. Test-clock customers go with
 * their clock; a customer a visitor created through Checkout (e.g. upgrading Initech) is
 * deleted directly, which also cancels its subscriptions.
 */
async function removeStripeObjects(customerId: string) {
  const stripe = getStripe();
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return;
    const clock = customer.test_clock;
    if (clock)
      await stripe.testHelpers.testClocks.del(typeof clock === 'string' ? clock : clock.id);
    else await stripe.customers.del(customerId);
  } catch (err) {
    if (!isMissing(err)) throw err;
  }
}

async function waitForClock(clockId: string) {
  const stripe = getStripe();
  for (let i = 0; i < 60; i++) {
    const clock = await stripe.testHelpers.testClocks.retrieve(clockId);
    if (clock.status === 'ready') return;
    if (clock.status === 'internal_failure') throw new Error(`Test clock ${clockId} failed`);
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error(`Test clock ${clockId} did not finish advancing`);
}

/**
 * A real Stripe test-mode subscription on a test clock, so its history looks lived-in:
 * - Acme: subscribed 12 days ago, paid with 4242 → active, 12 days into its period
 * - Globex: trial ended 2 days ago and the renewal charge failed → past due
 * The clock then stays frozen at "now", so nothing renews or retries until the next reset.
 */
async function provisionPaidSubscription(org: TDemoOrg, plan: Plan, pastDue: boolean) {
  if (!plan.stripePriceId || !plan.stripeMeteredPriceId) {
    throw new Error(`${plan.code} has no Stripe prices: run \`npm run stripe:setup\``);
  }
  const stripe = getStripe();
  const now = Math.floor(Date.now() / 1000);

  const clock = await stripe.testHelpers.testClocks.create({
    frozen_time: now - (pastDue ? 9 : 12) * DAY_S,
    name: `LedgerFlow demo · ${org.name}`,
  });
  const customer = await stripe.customers.create({
    test_clock: clock.id,
    name: org.name,
    // Attaches; the "chargeCustomerFail" card then declines every charge
    payment_method: pastDue ? 'pm_card_chargeCustomerFail' : 'pm_card_visa',
    metadata: { organizationId: org.id, ledgerflowDemo: 'true' },
  });
  const [method] = (await stripe.paymentMethods.list({ customer: customer.id, limit: 1 })).data;
  await stripe.customers.update(customer.id, {
    invoice_settings: { default_payment_method: method!.id },
  });
  await prisma.organization.update({
    where: { id: org.id },
    data: { stripeCustomerId: customer.id },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: plan.stripePriceId }, { price: plan.stripeMeteredPriceId }],
    metadata: { organizationId: org.id, planCode: plan.code },
    ...(pastDue && { trial_end: now - 2 * DAY_S }),
  });

  await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: now });
  await waitForClock(clock.id);
  // The same sync the webhooks run: plan, status, period dates, grace period, audit
  await syncSubscription(subscription.id);
}

// Without Stripe (CI, a laptop without keys) the paid states are written directly
async function writePaidStateWithoutStripe(org: TDemoOrg, plan: Plan, pastDue: boolean) {
  const start = Date.now() - (pastDue ? 2 : 12) * DAY_MS;
  await prisma.subscription.update({
    where: { organizationId: org.id },
    data: {
      planId: plan.id,
      status: pastDue ? 'PAST_DUE' : 'ACTIVE',
      currentPeriodStart: new Date(start),
      currentPeriodEnd: new Date(start + 30 * DAY_MS),
      graceEndsAt: pastDue ? new Date(Date.now() + config.gracePeriodDays * DAY_MS) : null,
    },
  });
}

/**
 * Usage that matches the scenario (e.g. Acme at 81% of its included units), recorded the
 * way the usage API records it: real events in the current period with their counter, so
 * the dashboards, the summary and verify-usage-counters all agree. Days before the period
 * get rollups only (charts read rollups, never raw events).
 */
async function seedUsage(org: TDemoOrg, percent: number) {
  const now = new Date();
  const ctx = await getUsageContext(tenantPrisma(org.id), now);
  const target = Math.round((ctx.includedUnits * percent) / 100);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const periodDay = Date.UTC(
    ctx.periodStart.getUTCFullYear(),
    ctx.periodStart.getUTCMonth(),
    ctx.periodStart.getUTCDate(),
  );

  // Weekdays busier than weekends; the weights decide each day's share of the target
  const days: { day: number; weight: number }[] = [];
  for (let d = periodDay; d <= today; d += DAY_MS) {
    const weekday = new Date(d).getUTCDay();
    days.push({
      day: d,
      weight: (weekday === 0 || weekday === 6 ? 0.45 : 1) * (0.8 + Math.random() * 0.4),
    });
  }
  const totalWeight = days.reduce((sum, d) => sum + d.weight, 0);

  const events: Prisma.UsageEventCreateManyInput[] = [];
  const rollups: Prisma.UsageDailyRollupCreateManyInput[] = [];
  let remaining = target;
  days.forEach(({ day, weight }, i) => {
    const units = i === days.length - 1 ? remaining : Math.round((target * weight) / totalWeight);
    remaining -= units;
    for (const [metric, share] of METRICS) {
      let quantity = Math.round(units * share);
      if (metric === 'api_calls')
        quantity = units - Math.round(units * 0.65) - Math.round(units * 0.25);
      if (quantity <= 0) continue;
      rollups.push({ organizationId: org.id, metric, day: new Date(day), quantity });
      for (let part = 0; quantity > 0; part++) {
        const chunk = Math.min(quantity, MAX_EVENT_QUANTITY);
        quantity -= chunk;
        // Earlier in the day than now, so "today" never holds future events
        const at = new Date(Math.min(day + (9 + part) * 3_600_000, now.getTime() - 60_000));
        events.push({
          organizationId: org.id,
          apiKeyId: org.apiKeyId,
          metric,
          quantity: chunk,
          idempotencyKey: `demo-${metric}-${new Date(day).toISOString().slice(0, 10)}-${part}`,
          occurredAt: at,
          createdAt: at,
          periodStart: ctx.periodStart,
          billable: false, // demo usage is never sent to Stripe
        });
      }
    }
  });

  // Earlier days: steady usage at a similar daily level (rollups only)
  const dailyLevel = target / Math.max(1, days.length);
  for (let d = today - (USAGE_HISTORY_DAYS - 1) * DAY_MS; d < periodDay; d += DAY_MS) {
    const weekday = new Date(d).getUTCDay();
    const units = Math.round(
      dailyLevel * (weekday === 0 || weekday === 6 ? 0.45 : 1) * (0.7 + Math.random() * 0.5),
    );
    for (const [metric, share] of METRICS) {
      const quantity = Math.round(units * share);
      if (quantity > 0)
        rollups.push({ organizationId: org.id, metric, day: new Date(d), quantity });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.usageEvent.createMany({ data: events });
    await tx.usageCounter.create({
      data: { organizationId: org.id, periodStart: ctx.periodStart, units: target },
    });
    await tx.usageDailyRollup.createMany({ data: rollups });
  });
  return target;
}

/**
 * SRS 21.2: recreates the demo organizations from scratch. Run nightly by the reset-demo
 * job (and `npm run demo:reset`), so whatever visitors changed is gone the next day. Only
 * this database's demo organizations are touched: they are found by their reserved slugs
 * and `isDemo`, and their Stripe objects through the customer ids saved on them.
 */
export async function resetDemo() {
  const startedAt = Date.now();
  const plans = await prisma.plan.findMany();
  const plan = Object.fromEntries(plans.map((p) => [p.code, p])) as Record<string, Plan>;
  if (!plan.FREE || !plan.PRO) throw new Error('Plans are missing: run `npm run db:seed` first');

  const clash = await prisma.organization.findFirst({
    where: { slug: { in: DEMO_TENANT_SLUGS }, isDemo: false },
    select: { slug: true },
  });
  if (clash) throw new Error(`"${clash.slug}" belongs to a real organization; demo not reset`);

  const useStripe = Boolean(config.stripe.secretKey && plan.PRO.stripePriceId);

  // 1. The previous demo's Stripe objects
  const previous = await prisma.organization.findMany({
    where: { isDemo: true, slug: { in: DEMO_TENANT_SLUGS }, stripeCustomerId: { not: null } },
    select: { stripeCustomerId: true },
  });
  if (config.stripe.secretKey) {
    await Promise.all(previous.map((o) => removeStripeObjects(o.stripeCustomerId!)));
  }

  // 2. Organizations, people, an API key each, and a little audit history
  const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
  const period = currentFreePeriod();
  const orgs = await prisma.$transaction(
    async (tx) => {
      // Organizations first: their API keys reference the users
      await tx.organization.deleteMany({
        where: { isDemo: true, slug: { in: DEMO_TENANT_SLUGS } },
      });
      await tx.user.deleteMany({ where: { email: { in: allDemoEmails() } } });

      const created: TDemoOrg[] = [];
      for (const [key, def] of Object.entries(DEMO_ORGS) as [
        DemoOrgKey,
        (typeof DEMO_ORGS)[DemoOrgKey],
      ][]) {
        const since = new Date(Date.now() - 75 * DAY_MS);
        const organization = await tx.organization.create({
          data: {
            name: def.name,
            slug: def.slug,
            isDemo: true,
            createdAt: since,
            subscription: {
              create: {
                planId: plan.FREE!.id,
                status: 'ACTIVE',
                currentPeriodStart: period.start,
                currentPeriodEnd: period.end,
              },
            },
          },
          select: { id: true },
        });

        const people = [
          ...Object.values(DEMO_ACCOUNTS).filter((a) => a.org === key),
          ...DEMO_EXTRA_MEMBERS.filter((m) => m.org === key),
        ];
        let ownerId = '';
        for (const [i, person] of people.entries()) {
          const joined = new Date(since.getTime() + i * 3 * DAY_MS);
          const user = await tx.user.create({
            data: {
              name: person.name,
              email: person.email,
              password: passwordHash, // nobody knows it: demo users sign in with /demo/login
              emailVerifiedAt: joined,
              createdAt: joined,
            },
            select: { id: true },
          });
          await tx.membership.create({
            data: {
              userId: user.id,
              organizationId: organization.id,
              role: person.role,
              createdAt: joined,
            },
          });
          if (person.role === 'OWNER') ownerId = user.id;
          else {
            await tx.auditLog.createMany({
              data: [
                {
                  organizationId: organization.id,
                  actorId: ownerId || null,
                  action: 'member.invited',
                  entityType: 'Invitation',
                  entityId: user.id,
                  after: { email: person.email, role: person.role },
                  createdAt: new Date(joined.getTime() - 2 * 3_600_000),
                },
                {
                  organizationId: organization.id,
                  actorId: user.id,
                  action: 'member.joined',
                  entityType: 'Membership',
                  entityId: user.id,
                  after: { userId: user.id, role: person.role },
                  createdAt: joined,
                },
              ],
            });
          }
        }

        const { keyHash, prefix } = generateApiKey(); // the key itself is never shown
        const apiKey = await tx.apiKey.create({
          data: {
            organizationId: organization.id,
            createdById: ownerId,
            name: 'Production server',
            prefix,
            keyHash,
            createdAt: new Date(since.getTime() + DAY_MS),
            lastUsedAt: new Date(Date.now() - 20 * 60_000),
          },
          select: { id: true },
        });
        await tx.auditLog.create({
          data: {
            organizationId: organization.id,
            actorId: ownerId,
            action: 'apikey.created',
            entityType: 'ApiKey',
            entityId: apiKey.id,
            after: { name: 'Production server', prefix },
            createdAt: new Date(since.getTime() + DAY_MS),
          },
        });
        created.push({ key, id: organization.id, name: def.name, ownerId, apiKeyId: apiKey.id });
      }
      return created;
    },
    { timeout: 60_000 },
  );
  const byKey = Object.fromEntries(orgs.map((o) => [o.key, o])) as Record<DemoOrgKey, TDemoOrg>;

  // 3. Paid scenarios: real Stripe test subscriptions (both at once), or direct rows
  const paid: [TDemoOrg, boolean][] = [
    [byKey.acme, false],
    [byKey.globex, true],
  ];
  if (useStripe) {
    await Promise.all(
      paid.map(([org, pastDue]) => provisionPaidSubscription(org, plan.PRO!, pastDue)),
    );
  } else {
    for (const [org, pastDue] of paid) await writePaidStateWithoutStripe(org, plan.PRO, pastDue);
  }

  // 4. Usage, now that each organization's period is known
  const usage: Record<string, number> = {};
  for (const org of orgs) usage[org.key] = await seedUsage(org, DEMO_ORGS[org.key].usagePercent);

  return {
    organizations: orgs.length,
    accounts: Object.keys(DEMO_ACCOUNTS).length,
    stripe: useStripe ? 'test subscriptions' : 'skipped (no Stripe key or prices)',
    usage: JSON.stringify(usage),
    durationMs: Date.now() - startedAt,
  };
}
