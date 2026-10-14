import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import requireOrgMember from '../../middlewares/requireOrgMember';
import requirePermission from '../../middlewares/requirePermission';
import validateRequest from '../../middlewares/validateRequest';
import { MemberRoutes } from '../member/member.route';
import { OrganizationController } from './organization.controller';
import { OrganizationValidation } from './organization.validation';

const router = Router();

router.post(
  '/',
  auth,
  validateRequest(OrganizationValidation.create),
  OrganizationController.createOrganization,
);

router.get('/:orgId', auth, requireOrgMember, OrganizationController.getOrganization);
router.patch(
  '/:orgId',
  auth,
  requireOrgMember,
  requirePermission('org:update'),
  validateRequest(OrganizationValidation.update),
  OrganizationController.updateOrganization,
);

// Every nested /orgs/:orgId/* router is guarded once here
router.use('/:orgId/members', auth, requireOrgMember, MemberRoutes);

export const OrganizationRoutes = router;
