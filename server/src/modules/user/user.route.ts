import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { blockDemoUser } from '../../middlewares/demoGuard';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';

const router = Router();

router.get('/me', auth, UserController.getMe);
router.patch(
  '/me',
  auth,
  blockDemoUser,
  validateRequest(UserValidation.updateMe),
  UserController.updateMe,
);
router.patch(
  '/me/password',
  auth,
  blockDemoUser,
  validateRequest(UserValidation.changePassword),
  UserController.changePassword,
);

export const UserRoutes = router;
