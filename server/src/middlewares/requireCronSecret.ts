import crypto from 'node:crypto';
import type { RequestHandler } from 'express';
import config from '../config';
import AppError from '../errors/AppError';

const digest = (value: string) => crypto.createHash('sha256').update(value).digest();

/**
 * Protects /internal/jobs/*. Vercel Cron and the GitHub scheduler send
 * `Authorization: Bearer <CRON_SECRET>`. Without a configured secret the routes
 * don't exist (404), so a missing env var can never leave them open.
 */
const requireCronSecret: RequestHandler = (req, _res, next) => {
  const secret = config.cronSecret;
  if (!secret) return next(new AppError(404, 'NOT_FOUND', 'Not found'));

  const header = req.get('authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  // Compare fixed-length digests so timing reveals nothing about the secret
  if (!crypto.timingSafeEqual(digest(provided), digest(secret))) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Invalid job secret'));
  }
  next();
};

export default requireCronSecret;
