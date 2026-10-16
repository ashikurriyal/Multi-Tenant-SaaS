import rateLimit from 'express-rate-limit';
import AppError from '../errors/AppError';
import { PrismaRateLimitStore } from './rateLimitStore';

// FR-AUTH-11: login and register, 5 requests per minute per IP
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  store: new PrismaRateLimitStore('auth'),
  // If the database is unreachable, don't lock everyone out of logging in
  passOnStoreError: true,
  handler: (_req, _res, next) =>
    next(new AppError(429, 'RATE_LIMITED', 'Too many attempts, please try again in a minute')),
});

// FR-AUTH-14/16: links sent by email (resend verification, forgot password),
// 3 per 15 minutes per IP, so the app can't be used to flood someone's inbox
export const emailLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  store: new PrismaRateLimitStore('email-link'),
  passOnStoreError: true,
  handler: (_req, _res, next) =>
    next(new AppError(429, 'RATE_LIMITED', 'Too many requests, please try again in 15 minutes')),
});
