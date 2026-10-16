import { prisma } from '../../lib/prisma';

// FR-PLAN-01: public pricing data. Stripe ids stay server-side; checkout looks them up
const listActivePlans = () =>
  prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { monthlyPriceCents: 'asc' },
    select: {
      code: true,
      name: true,
      monthlyPriceCents: true,
      seatLimit: true,
      includedUnits: true,
      overageUnitMicros: true,
    },
  });

export const PlanService = { listActivePlans };
