import rateLimit from 'express-rate-limit';
import AppError from '../errors/AppError';

// FR-AUTH-11: login and register, 5 requests per minute per IP
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(new AppError(429, 'RATE_LIMITED', 'Too many attempts, please try again in a minute')),
});
