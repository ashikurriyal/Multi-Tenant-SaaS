import { Router } from 'express';
import { blockInDemoOrg } from '../../middlewares/demoGuard';
import requirePermission from '../../middlewares/requirePermission';
import validateRequest from '../../middlewares/validateRequest';
import { MemberController } from './member.controller';
import { MemberValidation } from './member.validation';

// Mounted at /orgs/:orgId/members after auth + requireOrgMember
const router = Router({ mergeParams: true });

router.get(
  '/',
  requirePermission('members:read'),
  validateRequest(MemberValidation.list),
  MemberController.listMembers,
);
router.patch(
  '/:membershipId',
  requirePermission('members:manage'),
  blockInDemoOrg,
  validateRequest(MemberValidation.changeRole),
  MemberController.changeRole,
);
// No requirePermission: members may remove themselves (leave); the service checks the rest
router.delete(
  '/:membershipId',
  blockInDemoOrg,
  validateRequest(MemberValidation.remove),
  MemberController.removeMember,
);

export const MemberRoutes = router;
