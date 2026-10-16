import { prisma } from '../lib/prisma';
import { removeUnverifiedAccounts } from '../modules/auth/unverifiedAccounts';
import type { JobResult } from './registry';

const DAY_MS = 24 * 60 * 60 * 1000;
const UNVERIFIED_TTL_MS = 7 * DAY_MS; // FR-AUTH-18
const BATCH_SIZE = 200;

/**
 * Daily housekeeping. Safe to run twice: every step deletes only rows that are already
 * past their lifetime.
 * - unverified accounts older than 7 days (frees the address for its real owner)
 * - email link tokens that are used or expired for more than a day
 * - rate-limit windows that have ended
 */
export async function cleanup(): Promise<JobResult> {
  const now = Date.now();

  const stale = await prisma.user.findMany({
    where: { emailVerifiedAt: null, createdAt: { lt: new Date(now - UNVERIFIED_TTL_MS) } },
    select: { id: true },
    take: BATCH_SIZE,
  });
  const accounts = await prisma.$transaction((tx) =>
    removeUnverifiedAccounts(
      tx,
      stale.map((u) => u.id),
    ),
  );

  const dayAgo = new Date(now - DAY_MS);
  const tokens = await prisma.emailToken.deleteMany({
    where: { OR: [{ expiresAt: { lt: dayAgo } }, { usedAt: { lt: dayAgo } }] },
  });
  const rateLimits = await prisma.rateLimit.deleteMany({
    where: { resetAt: { lt: new Date(now) } },
  });

  const result = {
    unverifiedUsers: accounts.users,
    organizations: accounts.organizations,
    emailTokens: tokens.count,
    rateLimits: rateLimits.count,
  };
  console.info('[cleanup]', JSON.stringify(result));
  return result;
}
