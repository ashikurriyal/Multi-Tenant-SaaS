import type { RequestHandler } from 'express';
import AppError from '../errors/AppError';
import { DEMO_RESTRICTED_MESSAGE, isDemoEmail } from '../modules/demo/demo.config';

/**
 * The demo organizations are shared by every visitor until the nightly reset, so actions
 * that would spoil it for the next person (or send real email) are refused there:
 * invitations, member and role changes, renaming. Everything else works normally.
 */
export const blockInDemoOrg: RequestHandler = (req, _res, next) =>
  next(req.org?.isDemo ? new AppError(403, 'DEMO_RESTRICTED', DEMO_RESTRICTED_MESSAGE) : undefined);

// For account-level changes by the demo users themselves (new organizations, renaming)
export const blockDemoUser: RequestHandler = (req, _res, next) =>
  next(
    req.user && isDemoEmail(req.user.email)
      ? new AppError(403, 'DEMO_RESTRICTED', DEMO_RESTRICTED_MESSAGE)
      : undefined,
  );
