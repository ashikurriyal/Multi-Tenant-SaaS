import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Stripe ids (stripePriceId, stripeMeteredPriceId) are written by `npm run stripe:setup`,
// never by the seed, so re-running the seed can't wipe them
const plans = [
  {
    code: 'FREE',
    name: 'Free',
    monthlyPriceCents: 0,
    seatLimit: 3,
    includedUnits: 1_000,
    overageUnitMicros: 0,
  },
  {
    code: 'PRO',
    name: 'Pro',
    monthlyPriceCents: 4_900,
    seatLimit: 10,
    includedUnits: 50_000,
    overageUnitMicros: 2_000, // $0.002 per unit
  },
  {
    code: 'BUSINESS',
    name: 'Business',
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
