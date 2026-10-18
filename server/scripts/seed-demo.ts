/**
 * Sample history for the dashboards (SRS 11.6 item 4): about 40 organizations with 12+
 * months of daily MRR snapshots (conversions, upgrades, downgrades, churn, reactivations)
 * and 90 days of daily usage, so the admin revenue charts tell a story on first load.
 *
 *   npm run seed:demo -- --yes                             # database in .env
 *   DATABASE_URL="<ledgerflow-prod string>" npm run seed:demo -- --yes
 *   npm run seed:demo -- --remove --yes                    # delete the sample data only
 *
 * It prints the target database first, and anything other than localhost needs --yes.
 *
 * Safe to re-run: every organization marked `isDemo` (and the sample users) is deleted
 * first, then everything is recreated relative to today. Real organizations are never
 * touched. Sample users can't log in (random password) and use @demo.ledgerflow.invalid
 * addresses, which can never receive email. Nothing is created in Stripe.
 *
 * The snapshots are daily, like the mrr-snapshot job writes them: the admin metrics use
 * each month's last snapshot day, so month-end-only rows would look like mass churn.
 * Each day's MRR comes from `mrrCentsOf`, the same rule the job uses.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import config from '../src/config';
import bcrypt from 'bcrypt';
import type { OrgRole, Plan, Prisma, SubscriptionStatus } from '../generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import { currentFreePeriod } from '../src/modules/organization/organization.utils';
import { DEMO_TENANT_SLUGS } from '../src/modules/demo/demo.config';
import { mrrCentsOf } from '../src/shared/metrics';

const DAY_MS = 24 * 60 * 60 * 1000;
const EMAIL_DOMAIN = 'demo.ledgerflow.invalid';
const HISTORY_DAYS = 395; // 13 months: the 12-month view also needs its starting month
const USAGE_DAYS = 90;
const CHUNK = 5_000;

const NAMES = [
  'Northwind Labs',
  'Brightline Health',
  'Copperleaf',
  'Juniper Analytics',
  'Bluefin Logistics',
  'Kestrel Legal',
  'Lumen Retail',
  'Harborview Insurance',
  'Tandem Health',
  'Quarry Data',
  'Redwood Payroll',
  'Sable Security',
  'Arcadia Learning',
  'Fernhill Media',
  'Granite Freight',
  'Halcyon Travel',
  'Ironclad Contracts',
  'Marigold Foods',
  'Nimbus Weather',
  'Orchard HR',
  'Pinecrest Realty',
  'Quill Publishing',
  'Riverstone Bank',
  'Saffron Studios',
  'Tidewater Ports',
  'Upland Farms',
  'Vantage Claims',
  'Willow Care',
  'Yellowtail Energy',
  'Zephyr Mobility',
  'Atlas Archive',
  'Beacon Clinics',
  'Cobalt Robotics',
  'Driftwood Hotels',
  'Ember Fintech',
  'Foxglove Pharma',
  'Glacier Storage',
  'Hearth Insurance',
  'Indigo Print',
  'Keystone Audit',
];
const FIRST_NAMES = [
  'Amara',
  'Ben',
  'Chen',
  'Dana',
  'Elif',
  'Farid',
  'Grace',
  'Hugo',
  'Ines',
  'Jonas',
  'Kofi',
  'Lena',
  'Mateo',
  'Nadia',
  'Omar',
  'Priya',
  'Quinn',
  'Rosa',
  'Sami',
  'Tara',
  'Uma',
  'Viktor',
];
const LAST_NAMES = [
  'Ahmed',
  'Brooks',
  'Costa',
  'Diaz',
  'Evans',
  'Fischer',
  'Garcia',
  'Haddad',
  'Ito',
  'Jensen',
  'Khan',
  'Lopez',
  'Moreau',
  'Novak',
  'Okafor',
  'Park',
  'Rossi',
  'Singh',
  'Tanaka',
  'Weber',
];
const METRICS = [
  ['documents_processed', 0.65],
  ['pages_ocr', 0.25],
  ['api_calls', 0.1],
] as const;

// Deterministic: the same story every run (dates move with today)
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20261018);
const between = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const pick = <T>(items: readonly T[]) => items[Math.floor(rng() * items.length)]!;

const todayUtc = () => {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
};
const dayDate = (dayMs: number) => new Date(dayMs);

type PlanCode = 'FREE' | 'PRO' | 'BUSINESS';
type DayState = { plan: PlanCode; status: 'FREE' | 'ACTIVE' | 'CANCELED' };

type SampleOrg = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  days: { day: number; state: DayState }[]; // from signup to today
  final: DayState;
  anchor: number | null; // day the current paid subscription started
  canceledAt: number | null;
  usageScale: number;
};

/** One organization's life, day by day. Plan changes happen on renewal days. */
function simulate(name: string, slug: string, today: number): SampleOrg {
  // More signups recently (a growing business), a few from the very start
  const age = Math.max(5, Math.round(HISTORY_DAYS * rng() ** 1.15));
  const signup = today - age * DAY_MS;
  const converts = rng() < 0.72;
  const convertOn = signup + between(7, 55) * DAY_MS;

  let state: DayState = { plan: 'FREE', status: 'FREE' };
  let anchor: number | null = null;
  let canceledAt: number | null = null;
  let reactivateOn: number | null = null;
  const days: SampleOrg['days'] = [];

  for (let d = signup; d <= today; d += DAY_MS) {
    if (state.status === 'FREE' && converts && d >= convertOn) {
      state = { plan: rng() < 0.75 ? 'PRO' : 'BUSINESS', status: 'ACTIVE' };
      anchor = d;
    } else if (state.status === 'ACTIVE' && anchor !== null && d > anchor) {
      const sinceStart = Math.round((d - anchor) / DAY_MS);
      if (sinceStart % 30 === 0) {
        const r = rng();
        if (r < 0.05) {
          state = { ...state, status: 'CANCELED' };
          canceledAt = d;
          reactivateOn = rng() < 0.45 ? d + between(20, 90) * DAY_MS : null;
        } else if (state.plan === 'PRO' && r < 0.05 + 0.08) {
          state = { ...state, plan: 'BUSINESS' };
        } else if (state.plan === 'BUSINESS' && r < 0.05 + 0.06) {
          state = { ...state, plan: 'PRO' };
        }
      }
    } else if (state.status === 'CANCELED' && reactivateOn !== null && d >= reactivateOn) {
      state = { plan: 'PRO', status: 'ACTIVE' };
      anchor = d;
      canceledAt = null;
      reactivateOn = null;
    }
    days.push({ day: d, state });
  }

  return {
    id: randomUUID(),
    name,
    slug,
    createdAt: dayDate(signup + between(8, 18) * 60 * 60 * 1000),
    days,
    final: state,
    anchor,
    canceledAt,
    usageScale: 0.6 + rng() * 0.9,
  };
}

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function removeSampleData(tx: Prisma.TransactionClient) {
  // Sample users belong only to sample organizations; organizations cascade to their
  // members, subscriptions, snapshots and usage
  const users = await tx.user.deleteMany({ where: { email: { endsWith: `@${EMAIL_DOMAIN}` } } });
  const orgs = await tx.organization.deleteMany({
    // The login demo organizations (npm run demo:reset) are left alone
    where: { isDemo: true, slug: { notIn: DEMO_TENANT_SLUGS } },
  });
  return { organizations: orgs.count, users: users.count };
}

// Where the data goes, without the password
function describeTarget() {
  const url = new URL(config.databaseUrl);
  return { host: url.hostname, database: url.pathname.slice(1) || '(default)' };
}

async function main() {
  const target = describeTarget();
  console.info(`Target database: ${target.host} / ${target.database}`);
  const local = ['localhost', '127.0.0.1', '::1'].includes(target.host);
  if (!local && !process.argv.includes('--yes')) {
    console.error('Not a local database: re-run with --yes to write sample data there.');
    process.exitCode = 1;
    return;
  }

  if (process.argv.includes('--remove')) {
    const removed = await prisma.$transaction(removeSampleData, { timeout: 120_000 });
    console.info('Removed sample data:', JSON.stringify(removed));
    return;
  }

  const plans = await prisma.plan.findMany();
  const plan = Object.fromEntries(plans.map((p) => [p.code, p])) as Record<PlanCode, Plan>;
  if (!plan.FREE || !plan.PRO || !plan.BUSINESS) {
    throw new Error('Plans are missing: run `npm run db:seed` first');
  }
  if (!plan.PRO.stripePriceId) {
    console.warn(
      'Note: PRO has no Stripe price yet, so sample MRR is $0 (same rule as the mrr-snapshot job). Run `npm run stripe:setup`, then this script again.',
    );
  }

  const today = todayUtc();
  const now = new Date();
  const mrrOn = (state: DayState) =>
    state.status === 'FREE'
      ? 0
      : mrrCentsOf(
          {
            status: state.status === 'ACTIVE' ? 'ACTIVE' : 'CANCELED',
            graceEndsAt: null,
            plan: plan[state.plan],
          },
          now,
        );

  const removed = await prisma.$transaction(removeSampleData, { timeout: 120_000 });

  const taken = new Set(
    (await prisma.organization.findMany({ select: { slug: true } })).map((o) => o.slug),
  );
  const uniqueSlug = (name: string) => {
    const base = slugify(name);
    for (let i = 0; ; i++) {
      const slug = i === 0 ? base : `${base}-${i + 1}`;
      if (!taken.has(slug)) {
        taken.add(slug);
        return slug;
      }
    }
  };

  const orgs = NAMES.map((name) => simulate(name, uniqueSlug(name), today));

  // A few paying customers in other states, for the admin tables (MRR unchanged:
  // a past-due organization inside its grace period still counts)
  const active = orgs.filter((o) => o.final.status === 'ACTIVE');
  const pastDue = new Set(active.slice(0, 2).map((o) => o.id));
  const cancelling = new Set(active.slice(2, 4).map((o) => o.id));

  // One password nobody knows, hashed once: the accounts exist only to show members
  const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);

  const users: Prisma.UserCreateManyInput[] = [];
  const memberships: Prisma.MembershipCreateManyInput[] = [];
  const subscriptions: Prisma.SubscriptionCreateManyInput[] = [];
  const snapshots: Prisma.MrrSnapshotCreateManyInput[] = [];
  const rollups: Prisma.UsageDailyRollupCreateManyInput[] = [];

  for (const org of orgs) {
    // Members within the plan's seat limit
    const extra =
      org.final.plan === 'BUSINESS'
        ? between(3, 11)
        : org.final.plan === 'PRO'
          ? between(1, 5)
          : between(0, 2);
    for (let i = 0; i <= extra; i++) {
      const userId = randomUUID();
      const first = pick(FIRST_NAMES);
      users.push({
        id: userId,
        name: `${first} ${pick(LAST_NAMES)}`,
        email: `${org.slug}.${i + 1}@${EMAIL_DOMAIN}`,
        password: passwordHash,
        emailVerifiedAt: org.createdAt, // unverified accounts are deleted by the cleanup job
        createdAt: org.createdAt,
      });
      const role: OrgRole =
        i === 0 ? 'OWNER' : pick(['ADMIN', 'BILLING', 'MEMBER', 'MEMBER'] as const);
      memberships.push({ userId, organizationId: org.id, role, createdAt: org.createdAt });
    }

    // The subscription row matches the last day of the simulation
    const { final } = org;
    const free = currentFreePeriod(now);
    if (final.status === 'FREE') {
      subscriptions.push({
        organizationId: org.id,
        planId: plan.FREE.id,
        status: 'ACTIVE',
        currentPeriodStart: free.start,
        currentPeriodEnd: free.end,
      });
    } else if (final.status === 'CANCELED') {
      const end = org.canceledAt ?? today;
      subscriptions.push({
        organizationId: org.id,
        planId: plan[final.plan].id,
        status: 'CANCELED',
        currentPeriodStart: dayDate(end - 30 * DAY_MS),
        currentPeriodEnd: dayDate(end),
      });
    } else {
      const sinceStart = Math.floor((today - org.anchor!) / DAY_MS);
      const periodStart = org.anchor! + Math.floor(sinceStart / 30) * 30 * DAY_MS;
      const status: SubscriptionStatus = pastDue.has(org.id) ? 'PAST_DUE' : 'ACTIVE';
      subscriptions.push({
        organizationId: org.id,
        planId: plan[final.plan].id,
        status,
        currentPeriodStart: dayDate(periodStart),
        currentPeriodEnd: dayDate(periodStart + 30 * DAY_MS),
        cancelAtPeriodEnd: cancelling.has(org.id),
        graceEndsAt: status === 'PAST_DUE' ? dayDate(today + between(2, 5) * DAY_MS) : null,
      });
    }

    // Daily MRR, exactly what the mrr-snapshot job would have written
    for (const { day, state } of org.days) {
      snapshots.push({
        day: dayDate(day),
        organizationId: org.id,
        planId: state.status === 'FREE' ? plan.FREE.id : plan[state.plan].id,
        mrrCents: mrrOn(state),
      });
    }

    // Daily usage for the last 90 days: plan-sized, quieter at weekends, slowly growing
    const usageFrom = today - (USAGE_DAYS - 1) * DAY_MS;
    for (const { day, state } of org.days) {
      if (day < usageFrom) continue;
      const weekday = new Date(day).getUTCDay();
      const weekend = weekday === 0 || weekday === 6 ? 0.45 : 1;
      const growth = 1 + ((day - usageFrom) / DAY_MS) * 0.004;
      const base =
        state.status !== 'ACTIVE'
          ? between(0, 30) // Free stays under its 1,000 units a month
          : state.plan === 'BUSINESS'
            ? between(9_000, 20_000) * org.usageScale
            : between(900, 2_100) * org.usageScale;
      const total = Math.round(base * (state.status === 'ACTIVE' ? weekend * growth : 1));
      for (const [metric, share] of METRICS) {
        const quantity = Math.round(total * share);
        if (quantity > 0)
          rollups.push({ organizationId: org.id, metric, day: dayDate(day), quantity });
      }
    }
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.organization.createMany({
        data: orgs.map((o) => ({
          id: o.id,
          name: o.name,
          slug: o.slug,
          isDemo: true,
          createdAt: o.createdAt,
        })),
      });
      await tx.user.createMany({ data: users });
      await tx.membership.createMany({ data: memberships });
      await tx.subscription.createMany({ data: subscriptions });
      for (let i = 0; i < snapshots.length; i += CHUNK) {
        await tx.mrrSnapshot.createMany({ data: snapshots.slice(i, i + CHUNK) });
      }
      for (let i = 0; i < rollups.length; i += CHUNK) {
        await tx.usageDailyRollup.createMany({ data: rollups.slice(i, i + CHUNK) });
      }
    },
    { timeout: 120_000 },
  );

  const todayRows = snapshots.filter((s) => (s.day as Date).getTime() === today);
  console.info(
    'Sample data:',
    JSON.stringify({
      removedFirst: removed,
      organizations: orgs.length,
      users: users.length,
      payingToday: todayRows.filter((s) => s.mrrCents > 0).length,
      mrrTodayCents: todayRows.reduce((sum, s) => sum + s.mrrCents, 0),
      snapshotRows: snapshots.length,
      usageRows: rollups.length,
    }),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
