import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import requireSuperAdmin from '../../middlewares/requireSuperAdmin';
import validateRequest from '../../middlewares/validateRequest';
import { AdminController } from './admin.controller';
import { AdminValidation } from './admin.validation';

// Platform-wide views for super admins only; reads across all organizations
const router = Router();

router.use(auth, requireSuperAdmin);

router.get('/metrics/mrr', validateRequest(AdminValidation.months), AdminController.getMrr);
router.get('/metrics/churn', validateRequest(AdminValidation.months), AdminController.getChurn);
router.get('/tenants', validateRequest(AdminValidation.tenants), AdminController.listTenants);
router.get(
  '/webhook-events',
  validateRequest(AdminValidation.webhookEvents),
  AdminController.listWebhookEvents,
);

export const AdminRoutes = router;
