import crypto from 'node:crypto';
import type { CookieOptions } from 'express';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import config from '../config';
import AppError from '../errors/AppError';
import { prisma } from '../lib/prisma';

export const REFRESH_COOKIE = 'refreshToken';

type TRefreshPayload = JwtPayload & { sub: string; fid: string; jti: string };

export const signAccessToken = (user: Express.User) =>
  jwt.sign(
    { sub: user.id, email: user.email, platformRole: user.platformRole },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'], algorithm: 'HS256' },
  );

export async function issueRefreshToken(userId: string, familyId: string = crypto.randomUUID()) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: userId, fid: familyId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
    jwtid: jti,
    algorithm: 'HS256',
  });
  const { exp } = jwt.decode(token) as JwtPayload;
  const expiresAt = new Date(exp! * 1000);

  await prisma.refreshToken.create({ data: { id: jti, userId, familyId, expiresAt } });
  return { token, expiresAt };
}

// Returns null instead of throwing, so callers decide what an invalid token means
export const verifyRefreshToken = (token: string): TRefreshPayload | null => {
  try {
    const payload = jwt.verify(token, config.jwt.refreshSecret, { algorithms: ['HS256'] });
    return typeof payload === 'object' && payload.jti ? (payload as TRefreshPayload) : null;
  } catch {
    return null;
  }
};

export const revokeFamily = (familyId: string) =>
  prisma.refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

const sessionExpired = () =>
  new AppError(401, 'UNAUTHORIZED', 'Session expired, please log in again');

export async function rotateRefreshToken(oldToken: string) {
  const payload = verifyRefreshToken(oldToken);
  if (!payload) throw sessionExpired();

  const row = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
  if (!row) throw sessionExpired();

  // Revoke atomically: if two requests race, only one can win this update
  const { count } = await prisma.refreshToken.updateMany({
    where: { id: row.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (count === 0) {
    // Already used → possible theft. Kill the whole family (FR-AUTH-08)
    await revokeFamily(row.familyId);
    throw new AppError(
      401,
      'TOKEN_REUSED',
      'Session ended for security reasons, please log in again',
    );
  }

  const next = await issueRefreshToken(row.userId, row.familyId);
  return { userId: row.userId, familyId: row.familyId, ...next };
}

export const refreshCookieOptions = (expires?: Date): CookieOptions => ({
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'lax', // same-origin thanks to the Next.js rewrite (docs section 5.2)
  path: '/api/v1/auth',
  ...(expires && { expires }),
});
