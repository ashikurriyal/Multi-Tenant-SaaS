import httpStatus from 'http-status';
import { sendEmails } from '../../jobs/sendEmails';
import { runInBackground } from '../../lib/background';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { InvitationService } from './invitation.service';

const listPending = catchAsync(async (req, res) => {
  const result = await InvitationService.listPending(req.org!.db);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Invitations retrieved successfully',
    data: result,
  });
});

const createInvitation = catchAsync(async (req, res) => {
  const { db, id } = req.org!;
  const result = await InvitationService.createInvitation(db, id, req.user!, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Invitation sent',
    data: result,
  });
  // Deliver now instead of waiting for the next scheduled run
  runInBackground('send-emails', sendEmails);
});

const revokeInvitation = catchAsync(async (req, res) => {
  const { db, id } = req.org!;
  await InvitationService.revokeInvitation(db, id, req.user!.id, String(req.params.invitationId));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Invitation revoked',
  });
});

const getInvitation = catchAsync(async (req, res) => {
  const result = await InvitationService.getInvitation(String(req.params.token));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Invitation retrieved successfully',
    data: result,
  });
});

const acceptInvitation = catchAsync(async (req, res) => {
  const result = await InvitationService.acceptInvitation(String(req.params.token), req.user!);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Invitation accepted',
    data: { organization: result },
  });
});

export const InvitationController = {
  listPending,
  createInvitation,
  revokeInvitation,
  getInvitation,
  acceptInvitation,
};
