import bcrypt from 'bcrypt';
import config from '../../config';
import AppError from '../../errors/AppError';
import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import {
  issueRefreshToken,
  revokeFamily,
  rotateRefreshToken,
  signAccessToken,
  verifyRefreshToken,
} from '../../utils/tokens';
import { addMonths, generateUniqueSlug } from './auth.utils';
import type { TRegisterPayload } from './auth.validation';

const emailTaken = () =>
  new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');

// FR-AUTH-01: user, organization, OWNER membership and FREE subscription in one transaction
const register = async (payload: TRegisterPayload) => {
  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) throw emailTaken();

  const freePlan = await prisma.plan.findUnique({ where: { code: 'FREE' } });
  if (!freePlan) throw new Error('FREE plan is missing, run the seed');

  const password = await bcrypt.hash(payload.password, config.bcryptSaltRounds);
  const slug = await generateUniqueSlug(payload.organizationName, async (candidate) =>
    Boolean(await prisma.organization.findUnique({ where: { slug: candidate } })),
  );
  const now = new Date();

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: payload.name, email: payload.email, password },
        select: { id: true, name: true, email: true, platformRole: true },
      });

      const organization = await tx.organization.create({
        data: {
          name: payload.organizationName,
          slug,
          memberships: { create: { userId: user.id, role: 'OWNER' } },
          subscription: {
            create: {
              planId: freePlan.id,
              status: 'ACTIVE',
              currentPeriodStart: now,
              currentPeriodEnd: addMonths(now, 1),
            },
          },
        },
        select: { id: true, name: true, slug: true },
      });

      return { user, organization: { ...organization, role: 'OWNER' as const } };
    });
  } catch (err) {
    // Two sign-ups with the same email at the same moment: the unique index decides
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const taken = await prisma.user.findUnique({ where: { email: payload.email } });
      if (taken) throw emailTaken();
    }
    throw err;
  }
};

const login = async (user: Express.User) => {
  const accessToken = signAccessToken(user);
  const refresh = await issueRefreshToken(user.id);
  return { accessToken, refresh, user };
};

const refreshToken = async (token: string | undefined) => {
  if (!token) throw new AppError(401, 'UNAUTHORIZED', 'Please log in');

  const rotated = await rotateRefreshToken(token);

  const user = await prisma.user.findUnique({
    where: { id: rotated.userId },
    select: { id: true, name: true, email: true, platformRole: true, status: true },
  });
  if (!user || user.status === 'BLOCKED') {
    await revokeFamily(rotated.familyId);
    throw user
      ? new AppError(403, 'USER_BLOCKED', 'Your account is blocked')
      : new AppError(401, 'UNAUTHORIZED', 'Please log in');
  }

  const { status: _status, ...authUser } = user;
  return {
    accessToken: signAccessToken(authUser),
    refresh: { token: rotated.token, expiresAt: rotated.expiresAt },
  };
};

// FR-AUTH-09: revoke the whole family; an invalid or missing cookie still logs out
const logout = async (token: string | undefined) => {
  const payload = token ? verifyRefreshToken(token) : null;
  if (payload?.fid) await revokeFamily(payload.fid);
};

export const AuthService = { register, login, refreshToken, logout };
