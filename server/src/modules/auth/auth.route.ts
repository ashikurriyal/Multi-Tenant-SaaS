import { Router } from 'express';
import { authenticateLocal } from '../../middlewares/auth';
import { authLimiter, emailLinkLimiter } from '../../middlewares/rateLimiter';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validateRequest(AuthValidation.register),
  AuthController.register,
);
router.post(
  '/login',
  authLimiter,
  validateRequest(AuthValidation.login),
  authenticateLocal,
  AuthController.login,
);
router.post(
  '/verify-email',
  authLimiter,
  validateRequest(AuthValidation.verifyEmail),
  AuthController.verifyEmail,
);
router.post(
  '/resend-verification',
  emailLinkLimiter,
  validateRequest(AuthValidation.resendVerification),
  AuthController.resendVerification,
);
router.post(
  '/forgot-password',
  emailLinkLimiter,
  validateRequest(AuthValidation.forgotPassword),
  AuthController.forgotPassword,
);
router.post(
  '/reset-password',
  authLimiter,
  validateRequest(AuthValidation.resetPassword),
  AuthController.resetPassword,
);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

export const AuthRoutes = router;
