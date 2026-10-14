import httpStatus from 'http-status';
import type { Request } from 'express';
import catchAsync from '../../utils/catchAsync';
import type { TPagination } from '../../utils/pagination';
import sendResponse from '../../utils/sendResponse';
import { MemberService } from './member.service';

const actorOf = (req: Request) => ({ userId: req.user!.id, role: req.org!.role });

const listMembers = catchAsync(async (req, res) => {
  const { data, meta } = await MemberService.listMembers(
    req.org!.db,
    req.query as unknown as TPagination,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Members retrieved successfully',
    meta,
    data,
  });
});

const changeRole = catchAsync(async (req, res) => {
  const { db, id } = req.org!;
  const result = await MemberService.changeRole(
    db,
    id,
    actorOf(req),
    String(req.params.membershipId),
    req.body.role,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Member role updated successfully',
    data: result,
  });
});

const removeMember = catchAsync(async (req, res) => {
  const { db, id } = req.org!;
  await MemberService.removeMember(db, id, actorOf(req), String(req.params.membershipId));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Member removed successfully',
  });
});

export const MemberController = { listMembers, changeRole, removeMember };
