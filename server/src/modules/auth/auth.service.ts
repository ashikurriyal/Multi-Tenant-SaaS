import bcrypt from 'bcrypt';
import config from '../../config';
import AppError from '../../errors/AppError';
import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { sha256 } from '../../utils/hash';
import {
  issueRefreshToken,
  revokeFamily,
  rotateRefreshToken,
  signAccessToken,
  verifyRefreshToken,
} from '../../utils/tokens';
import { queueEmail } from '../email/email.outbox';
import { createOrganizationWithOwner, withSlugRetry } from '../organization/organization.service';
import { consumeEmailToken, issueEmailToken, sentRecently } from './emailToken.service';
import type { TRegisterPayload } from './auth.validation';
import { removeUnverifiedAccounts } from './unverifiedAccounts';

type TTx = Prisma.TransactionClient;

const authUserSelect = { id: true, name: true, email: true, platformRole: true } as const;

const emailTaken = () =>
  new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');

const verifyLink = (token: string, next?: string) =>
  `${config.clientUrl}/verify-email?token=${token}${next ? `&next=${encodeURIComponent(next)}` : ''}`;

// Queues the "verify your email" message in the caller's transaction (FR-MAIL-01)
async function queueVerificationEmail(
  tx: TTx,
  user: { id: string; name: string; email: string },
  next?: string,
) {
  const { token, expiresAt } = await issueEmailToken(tx, user.id, 'VERIFY_EMAIL');
  await queueEmail(tx, {
    organizationId: null,
    toEmail: user.email,
    template: 'verify_email',
    data: { name: user.name, link: verifyLink(token, next), expiresAt: expiresAt.toISOString() },
  });
}

// The invitation link proves the person can read this inbox (FR-AUTH-15)
async function inviteProvesEmail(inviteToken: string | undefined, email: string) {
  if (!inviteToken) return false;
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: sha256(inviteToken) },
    select: { email: true, acceptedAt: true, expiresAt: true },
  });
  return Boolean(
    invitation &&
    invitation.email === email &&
    !invitation.acceptedAt &&
    invitation.expiresAt > new Date(),
  );
}

/**
 * FR-AUTH-01, FR-AUTH-12: user, organization, OWNER membership and FREE subscription in one
 * transaction. The account can't log in until the email is verified, unless it was
 * created from an invitation sent to the same address.
 */
const register = async (payload: TRegisterPayload) => {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true, emailVerifiedAt: true },
  });
  if (existing?.emailVerifiedAt) throw emailTaken();

  const verified = await inviteProvesEmail(payload.inviteToken, payload.email);
  const password = await bcrypt.hash(payload.password, config.bcryptSaltRounds);

  try {
    const result = await withSlugRetry(() =>
      prisma.$transaction(async (tx) => {
        // Someone signed up with this address before but never verified it: replace that
        // attempt, so nobody can block an email address by registering it first
        if (existing) await removeUnverifiedAccounts(tx, [existing.id]);

        const user = await tx.user.create({
          data: {
            name: payload.name,
            email: payload.email,
            password,
            emailVerifiedAt: verified ? new Date() : null,
          },
          select: authUserSelect,
        });
        const organization = await createOrganizationWithOwner(
          tx,
          user.id,
          payload.organizationName,
        );
        if (!verified) await queueVerificationEmail(tx, user, payload.next);
        return { user, organization };
      }),
    );
    return { ...result, verified };
  } catch (err) {
    // Two sign-ups with the same email at the same moment: the unique index decides
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const taken = await prisma.user.findUnique({ where: { email: payload.email } });
      if (taken) throw emailTaken();
    }
    throw err;
  }
};

const startSession = async (user: Express.User) => {
  const accessToken = signAccessToken(user);
  const refresh = await issueRefreshToken(user.id);
  return { accessToken, refresh, user };
};

const login = (user: Express.User) => startSession(user);

// FR-AUTH-13: the link logs the user in, since it proves they own the address
const verifyEmail = async (token: string) => {
  const user = await prisma.$transaction(async (tx) => {
    const userId = await consumeEmailToken(tx, token, 'VERIFY_EMAIL');
    return tx.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
      select: { ...authUserSelect, status: true },
    });
  });
  if (user.status === 'BLOCKED') throw new AppError(403, 'USER_BLOCKED', 'Your account is blocked');

  const { status: _status, ...authUser } = user;
  return startSession(authUser);
};

/**
 * FR-AUTH-14. Always ends the same way for the caller, so it can't be used to find out
 * which addresses have accounts. Returns whether an email was queued (for the controller).
 */
const resendVerification = async (email: string, next?: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, status: true, emailVerifiedAt: true },
  });
  if (!user || user.emailVerifiedAt || user.status === 'BLOCKED') return false;
  if (await sentRecently(user.id, 'VERIFY_EMAIL')) return false;

  await prisma.$transaction((tx) => queueVerificationEmail(tx, user, next));
  return true;
};

// FR-AUTH-16: verified users get a reset link; unverified ones a new verification link
const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, status: true, emailVerifiedAt: true },
  });
  if (!user || user.status === 'BLOCKED') return false;
  if (!user.emailVerifiedAt) return resendVerification(email);
  if (await sentRecently(user.id, 'RESET_PASSWORD')) return false;

  await prisma.$transaction(async (tx) => {
    const { token, expiresAt } = await issueEmailToken(tx, user.id, 'RESET_PASSWORD');
    await queueEmail(tx, {
      organizationId: null,
      toEmail: user.email,
      template: 'reset_password',
      data: {
        name: user.name,
        link: `${config.clientUrl}/reset-password?token=${token}`,
        expiresAt: expiresAt.toISOString(),
      },
    });
  });
  return true;
};

// FR-AUTH-17: new password, and every existing session on every device ends
const resetPassword = async (token: string, newPassword: string) => {
  const hash = await bcrypt.hash(newPassword, config.bcryptSaltRounds);
  await prisma.$transaction(async (tx) => {
    const userId = await consumeEmailToken(tx, token, 'RESET_PASSWORD');
    await tx.user.update({ where: { id: userId }, data: { password: hash } });
    await tx.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });
};

const refreshToken = async (token: string | undefined) => {
  if (!token) throw new AppError(401, 'UNAUTHORIZED', 'Please log in');

  const rotated = await rotateRefreshToken(token);

  const user = await prisma.user.findUnique({
    where: { id: rotated.userId },
    select: { ...authUserSelect, status: true, emailVerifiedAt: true },
  });
  if (!user || user.status === 'BLOCKED' || !user.emailVerifiedAt) {
    await revokeFamily(rotated.familyId);
    throw user?.status === 'BLOCKED'
      ? new AppError(403, 'USER_BLOCKED', 'Your account is blocked')
      : new AppError(401, 'UNAUTHORIZED', 'Please log in');
  }

  const { status: _status, emailVerifiedAt: _verifiedAt, ...authUser } = user;
  return {
    accessToken: signAccessToken(authUser),
    refresh: { token: rotated.token, expiresAt: rotated.expiresAt },
    userId: authUser.id,
  };
};

// FR-AUTH-09: revoke the whole family; an invalid or missing cookie still logs out
const logout = async (token: string | undefined) => {
  const payload = token ? verifyRefreshToken(token) : null;
  if (payload?.fid) await revokeFamily(payload.fid);
};

export const AuthService = {
  register,
  login,
  startSession,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
};
