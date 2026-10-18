import { prisma } from '../lib/prisma';
import { mrrCentsOf } from '../shared/metrics';
import type { JobResult } from './registry';

/**
 * FR-AN-02, SRS section 13, daily. Writes today's (UTC) MRR for every organization, zero
 * included, so the admin metrics can compare any two days. Safe to run twice: a second
 * run that day overwrites the row with the current value.
 */
export async function mrrSnapshot(): Promise<JobResult> {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);

  const [organizations, freePlan] = await Promise.all([
    prisma.organization.findMany({
      select: {
        id: true,
        subscription: {
          select: {
            planId: true,
            status: true,
            graceEndsAt: true,
            plan: { select: { monthlyPriceCents: true, stripePriceId: true } },
          },
        },
      },
    }),
    prisma.plan.findUnique({ where: { code: 'FREE' }, select: { id: true } }),
  ]);
  if (!freePlan) throw new Error('FREE plan is missing, run the seed');

  const ids = organizations.map((o) => o.id);
  const planIds = organizations.map((o) => o.subscription?.planId ?? freePlan.id);
  const cents = organizations.map((o) => mrrCentsOf(o.subscription, now));

  // One statement for all organizations
  const rows = await prisma.$executeRaw`
    INSERT INTO mrr_snapshots (day, "organizationId", "planId", "mrrCents")
    SELECT ${day}::date, o.id, o.plan, o.cents
    FROM unnest(${ids}::text[], ${planIds}::text[], ${cents}::int[]) AS o(id, plan, cents)
    ON CONFLICT (day, "organizationId") DO UPDATE
      SET "planId" = EXCLUDED."planId", "mrrCents" = EXCLUDED."mrrCents"`;

  const result = {
    day,
    organizations: rows,
    paying: cents.filter((c) => c > 0).length,
    mrrCents: cents.reduce((sum, c) => sum + c, 0),
  };
  console.info('[mrr-snapshot]', JSON.stringify(result));
  return result;
}
