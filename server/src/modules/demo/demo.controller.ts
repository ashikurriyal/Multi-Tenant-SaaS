import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { REFRESH_COOKIE, refreshCookieOptions } from '../../utils/tokens';
import { DemoAuth } from './demo.auth';

const listAccounts = catchAsync(async (_req, res) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Demo accounts retrieved',
    data: await DemoAuth.listAccounts(),
  });
});

// Same response and cookie as POST /auth/login
const login = catchAsync(async (req, res) => {
  const { accessToken, refresh, user } = await DemoAuth.login(req.body.account);
  res.cookie(REFRESH_COOKIE, refresh.token, refreshCookieOptions(refresh.expiresAt));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Logged in to the demo',
    data: { accessToken, user },
  });
});

export const DemoController = { listAccounts, login };
