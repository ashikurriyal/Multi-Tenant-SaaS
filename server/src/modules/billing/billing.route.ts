import { Router } from 'express';
import requirePermission from '../../middlewares/requirePermission';
import validateRequest from '../../middlewares/validateRequest';
import { BillingController } from './billing.controller';
import { BillingValidation } from './billing.validation';

// Mounted at /orgs/:orgId/billing after auth + requireOrgMember
const router = Router({ mergeParams: true });

router.get('/subscription', requirePermission('billing:read'), BillingController.getSubscription);
router.post(
  '/checkout-session',
  requirePermission('billing:manage'),
  validateRequest(BillingValidation.checkout),
  BillingController.createCheckoutSession,
);
router.post(
  '/portal-session',
  requirePermission('billing:manage'),
  BillingController.createPortalSession,
);

router.post(
  '/change-plan/preview',
  requirePermission('billing:manage'),
  validateRequest(BillingValidation.changePlanPreview),
  BillingController.previewPlanChange,
);
router.post(
  '/change-plan',
  requirePermission('billing:manage'),
  validateRequest(BillingValidation.changePlan),
  BillingController.changePlan,
);
router.get(
  '/invoices',
  requirePermission('billing:read'),
  validateRequest(BillingValidation.listInvoices),
  BillingController.listInvoices,
);

export const BillingRoutes = router;
