import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { InvitationController } from './invitation.controller';
import { InvitationValidation } from './invitation.validation';

// Mounted at /orgs/:orgId/invitations after auth + requireOrgMember + members:manage
const orgRouter = Router({ mergeParams: true });

orgRouter.get('/', InvitationController.listPending);
orgRouter.post(
  '/',
  validateRequest(InvitationValidation.create),
  InvitationController.createInvitation,
);
orgRouter.delete('/:invitationId', InvitationController.revokeInvitation);

// Mounted at /invitations — reached from the emailed link
const publicRouter = Router();

publicRouter.get(
  '/:token',
  validateRequest(InvitationValidation.token),
  InvitationController.getInvitation,
);
publicRouter.post(
  '/:token/accept',
  auth,
  validateRequest(InvitationValidation.token),
  InvitationController.acceptInvitation,
);

export const OrgInvitationRoutes = orgRouter;
export const InvitationRoutes = publicRouter;
