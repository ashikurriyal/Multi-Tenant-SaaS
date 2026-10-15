import { Router } from 'express';
import { authenticateLocal } from '../../middlewares/auth';
import { authLimiter } from '../../middlewares/rateLimiter';
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
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

export const AuthRoutes = router;
