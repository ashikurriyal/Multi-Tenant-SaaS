import type { RequestHandler } from 'express';
import passport from 'passport';
import AppError from '../errors/AppError';

// Wraps passport so failures use LedgerFlow's error format instead of a plain 401
const guard =
  (strategy: 'local' | 'jwt', error: AppError): RequestHandler =>
  (req, res, next) =>
    passport.authenticate(
      strategy,
      { session: false },
      (err: unknown, user: Express.User | false) => {
        if (err) return next(err);
        if (!user) return next(error);
        req.user = user;
        next();
      },
    )(req, res, next);

export const authenticateLocal = guard(
  'local',
  new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password'),
);

export const auth = guard('jwt', new AppError(401, 'UNAUTHORIZED', 'Please log in'));
