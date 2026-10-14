import type { RequestHandler } from 'express';
import AppError from '../errors/AppError';

// Platform staff only (/admin routes); runs after auth
const requireSuperAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.platformRole !== 'SUPER_ADMIN') {
    return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to do this'));
  }
  next();
};

export default requireSuperAdmin;
