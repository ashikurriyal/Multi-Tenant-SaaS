import { Router } from 'express';
import apiKeyAuth from '../../middlewares/apiKeyAuth';
import { usageLimiter } from '../../middlewares/rateLimiter';
import validateRequest from '../../middlewares/validateRequest';
import { UsageController } from './usage.controller';
import { UsageValidation } from './usage.validation';

// Machine endpoint: authenticated by API key (x-api-key), not by a user's JWT
const router = Router();

router.post(
  '/',
  apiKeyAuth,
  usageLimiter,
  validateRequest(UsageValidation.ingest),
  UsageController.ingest,
);

export const UsageRoutes = router;
