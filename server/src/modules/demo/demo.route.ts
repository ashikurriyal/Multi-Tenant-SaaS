import { Router } from 'express';
import { authLimiter } from '../../middlewares/rateLimiter';
import validateRequest from '../../middlewares/validateRequest';
import { DemoController } from './demo.controller';
import { DemoValidation } from './demo.validation';

const router = Router();

router.get('/accounts', DemoController.listAccounts);
router.post('/login', authLimiter, validateRequest(DemoValidation.login), DemoController.login);

export const DemoRoutes = router;
