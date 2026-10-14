import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { REFRESH_COOKIE, refreshCookieOptions } from '../../utils/tokens';
import { UserService } from './user.service';

const getMe = catchAsync(async (req, res) => {
  const result = await UserService.getMe(req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Profile retrieved successfully',
    data: result,
  });
});

const updateMe = catchAsync(async (req, res) => {
  const result = await UserService.updateMe(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Profile updated successfully',
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  await UserService.changePassword(req.user!.id, req.body);

  // Every session was revoked, including this one
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Password changed, please log in again',
  });
});

export const UserController = { getMe, updateMe, changePassword };
