import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Stripe price ids are filled in Phase 2 (scripts/createStripePrices.ts → .env)
const plans = [
  {
    code: 'FREE',
    name: 'Free',
    stripePriceId: null,
    stripeMeteredPriceId: null,
    monthlyPriceCents: 0,
    seatLimit: 3,
    includedUnits: 1_000,
    overageUnitMicros: 0,
  },
  {
    code: 'PRO',
    name: 'Pro',
    stripePriceId: process.env.STRIPE_PRICE_PRO || null,
    stripeMeteredPriceId: process.env.STRIPE_PRICE_PRO_METERED || null,
    monthlyPriceCents: 4_900,
    seatLimit: 10,
    includedUnits: 50_000,
    overageUnitMicros: 2_000, // $0.002 per unit
  },
  {
    code: 'BUSINESS',
    name: 'Business',
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS || null,
    stripeMeteredPriceId: process.env.STRIPE_PRICE_BUSINESS_METERED || null,
    monthlyPriceCents: 19_900,
    seatLimit: 50,
    includedUnits: 500_000,
    overageUnitMicros: 1_000, // $0.001 per unit
  },
];

async function seedPlans() {
  for (const { code, ...data } of plans) {
    await prisma.plan.upsert({ where: { code }, update: data, create: { code, ...data } });
  }
  console.info(`Plans: ${plans.map((p) => p.code).join(', ')}`);
}

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set');
  }

  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
  const hash = await bcrypt.hash(password, rounds);

  // Existing password is kept, so re-running the seed never resets it
  await prisma.user.upsert({
    where: { email },
    // Seeded accounts are trusted: no verification email needed
    update: { platformRole: 'SUPER_ADMIN', emailVerifiedAt: new Date() },
    create: {
      name: 'Super Admin',
      email,
      password: hash,
      platformRole: 'SUPER_ADMIN',
      emailVerifiedAt: new Date(),
    },
  });
  console.info(`Super admin: ${email}`);
}

async function main() {
  await seedPlans();
  await seedSuperAdmin();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
