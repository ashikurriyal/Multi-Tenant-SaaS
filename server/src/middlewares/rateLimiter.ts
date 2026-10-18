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

/**
 * FR-USE-09: 100 requests per second per API key. Counted in memory (per server instance)
 * rather than in PostgreSQL: a database write on every usage request would double the
 * database work of the busiest endpoint. With several instances the effective ceiling is
 * a multiple of 100/s; it guards against runaway clients, while the plan limit itself is
 * enforced exactly by the atomic counter.
 */
export const usageLimiter = rateLimit({
  windowMs: 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.apiKey?.id ?? 'no-key',
  handler: (_req, _res, next) =>
    next(
      new AppError(
        429,
        'RATE_LIMITED',
        'Too many usage requests: at most 100 per second per API key',
      ),
    ),
});

/**
 * NFR-SEC-06: 300 requests per minute per IP across the API, a ceiling against scripts
 * hammering it. Counted in memory per instance, like the usage limit: a PostgreSQL counter
 * would add a database write to every API call. Not counted here: the usage API (its own
 * per-key limit) and the scheduled-job routes (called by the scheduler, with a secret).
 * Stripe webhooks are mounted outside /api/v1's router and never reach it.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/usage') || req.path.startsWith('/internal/'),
  handler: (_req, _res, next) =>
    next(new AppError(429, 'RATE_LIMITED', 'Too many requests, please slow down')),
});
