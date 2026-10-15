import bcrypt from 'bcrypt';
import config from '../../config';
import AppError from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import type { TChangePasswordPayload, TUpdateMePayload } from './user.validation';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  platformRole: true,
  createdAt: true,
} as const;

// FR-USER-01: the user (never the password) and every organization they belong to
const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...publicUserSelect,
      memberships: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          organization: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

  return user;
};

const updateMe = (userId: string, payload: TUpdateMePayload) =>
  prisma.user.update({
    where: { id: userId },
    data: { name: payload.name },
    select: publicUserSelect,
  });

// FR-USER-03: on success every refresh token is revoked, so all devices must log in again
const changePassword = async (userId: string, payload: TChangePasswordPayload) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

  // 400, not 401: the client treats 401 as an expired access token and refreshes
  const valid = await bcrypt.compare(payload.currentPassword, user.password);
  if (!valid) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Current password is incorrect', [
      { path: 'currentPassword', message: 'Current password is incorrect' },
    ]);
  }

  const password = await bcrypt.hash(payload.newPassword, config.bcryptSaltRounds);

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { password } }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
};

export const UserService = { getMe, updateMe, changePassword };
