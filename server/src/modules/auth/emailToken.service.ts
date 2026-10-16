import type { EmailTokenPurpose, Prisma } from '../../../generated/prisma/client';
import AppError from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import { randomToken, sha256 } from '../../utils/hash';

export const EMAIL_TOKEN_TTL_MS: Record<EmailTokenPurpose, number> = {
  VERIFY_EMAIL: 24 * 60 * 60 * 1000, // 24 hours
  RESET_PASSWORD: 60 * 60 * 1000, // 1 hour
};

// Asking again within this window does nothing, so nobody can flood an inbox
export const RESEND_COOLDOWN_MS = 60 * 1000;

type TTx = Prisma.TransactionClient;

/**
 * Creates a one-time link token and returns the raw value (only its hash is stored).
 * Earlier unused tokens for the same purpose stop working.
 */
export async function issueEmailToken(tx: TTx, userId: string, purpose: EmailTokenPurpose) {
  await tx.emailToken.deleteMany({ where: { userId, purpose, usedAt: null } });

  const token = randomToken();
  const expiresAt = new Date(Date.now() + EMAIL_TOKEN_TTL_MS[purpose]);
  await tx.emailToken.create({ data: { userId, purpose, tokenHash: sha256(token), expiresAt } });
  return { token, expiresAt };
}

// True when a token for this purpose was sent less than RESEND_COOLDOWN_MS ago
export async function sentRecently(userId: string, purpose: EmailTokenPurpose) {
  const last = await prisma.emailToken.findFirst({
    where: { userId, purpose },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  return Boolean(last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS);
}

/**
 * Marks the token used and returns its user id. Unknown, expired and already-used
 * tokens all get the same 410, so the answer reveals nothing about which it was.
 * The update is atomic: a double click or two tabs can't use one link twice.
 */
export async function consumeEmailToken(tx: TTx, token: string, purpose: EmailTokenPurpose) {
  const tokenHash = sha256(token);
  const { count } = await tx.emailToken.updateMany({
    where: { tokenHash, purpose, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (count === 0) {
    throw new AppError(
      410,
      'TOKEN_EXPIRED',
      'This link has expired or was already used. Request a new one.',
    );
  }
  const row = await tx.emailToken.findUniqueOrThrow({
    where: { tokenHash },
    select: { userId: true },
  });
  return row.userId;
}
