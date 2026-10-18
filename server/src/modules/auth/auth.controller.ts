import type { Response } from 'express';
import httpStatus from 'http-status';
import { sendEmails } from '../../jobs/sendEmails';
import { runInBackground } from '../../lib/background';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { REFRESH_COOKIE, refreshCookieOptions } from '../../utils/tokens';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

// Same body for every outcome, so these endpoints never reveal whether an account exists
const LINK_SENT_MESSAGE =
  'If an account exists for this email, we have sent a link to it. Check your inbox.';

const setRefreshCookie = (res: Response, refresh: { token: string; expiresAt: Date }) => {
  // The refresh token lives only in the httpOnly cookie, never in the body
  res.cookie(REFRESH_COOKIE, refresh.token, refreshCookieOptions(refresh.expiresAt));
};

const sendQueuedEmails = () => runInBackground('send-emails', sendEmails);

const register = catchAsync(async (req, res) => {
  const { user, organization, verified } = await AuthService.register(req.body);

  if (verified) {
    // Signed up from an invitation to this address: no extra email, straight in
    const session = await AuthService.startSession(user);
    setRefreshCookie(res, session.refresh);
    return sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: 'Account created successfully',
      data: { user, organization, verificationRequired: false, accessToken: session.accessToken },
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Account created. Check your inbox to verify your email.',
    data: { user, organization, verificationRequired: true },
  });
  sendQueuedEmails();
});

const login = catchAsync(async (req, res) => {
  const { accessToken, refresh, user } = await AuthService.login(req.user!);
  setRefreshCookie(res, refresh);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Logged in successfully',
    data: { accessToken, user },
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  const { accessToken, refresh, user } = await AuthService.verifyEmail(req.body.token);
  setRefreshCookie(res, refresh);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Email verified',
    data: { accessToken, user },
  });
});

const resendVerification = catchAsync(async (req, res) => {
  const queued = await AuthService.resendVerification(req.body.email, req.body.next);
  sendResponse(res, { statusCode: httpStatus.OK, message: LINK_SENT_MESSAGE });
  if (queued) sendQueuedEmails();
});

const forgotPassword = catchAsync(async (req, res) => {
  const queued = await AuthService.forgotPassword(req.body.email);
  sendResponse(res, { statusCode: httpStatus.OK, message: LINK_SENT_MESSAGE });
  if (queued) sendQueuedEmails();
});

const resetPassword = catchAsync(async (req, res) => {
  await AuthService.resetPassword(req.body.token, req.body.password);
  // Any session in this browser ended too
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Password changed. Log in with your new password.',
  });
});

const refreshToken = catchAsync(async (req, res) => {
  // No cookie at all = a visitor without a session, the normal case on public pages: answer
  // "nothing to refresh" without an error (a 401 would show as a console error in browsers).
  // A cookie that is invalid, expired or reused still gets 401 below.
  if (!req.cookies[REFRESH_COOKIE]) {
    res.status(httpStatus.NO_CONTENT).end();
    return;
  }
  try {
    const { accessToken, refresh, userId } = await AuthService.refreshToken(
      req.cookies[REFRESH_COOKIE],
    );
    setRefreshCookie(res, refresh);

    // ?include=me: the page-load refresh also gets the account (same as GET /users/me),
    // saving the browser a second request that would have to wait for this one
    const me = req.query.include === 'me' ? await UserService.getMe(userId) : undefined;
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Token refreshed',
      data: { accessToken, ...(me && { me }) },
    });
  } catch (err) {
    // A dead session should not leave a stale cookie behind
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    throw err;
  }
});

const logout = catchAsync(async (req, res) => {
  await AuthService.logout(req.cookies[REFRESH_COOKIE]);
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Logged out successfully',
  });
});

export const AuthController = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
};
