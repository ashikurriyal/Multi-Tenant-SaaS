import type { RequestHandler } from 'express';
import AppError from '../errors/AppError';
import { can, type Permission } from '../shared/permissions';

// Runs after requireOrgMember, which sets req.org
const requirePermission =
  (permission: Permission): RequestHandler =>
  (req, _res, next) => {
    if (!req.org || !can(req.org.role, permission)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to do this'));
    }
    next();
  };

export default requirePermission;
