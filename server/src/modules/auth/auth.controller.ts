import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { REFRESH_COOKIE, refreshCookieOptions } from '../../utils/tokens';
import { AuthService } from './auth.service';

const register = catchAsync(async (req, res) => {
  const result = await AuthService.register(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Account created successfully',
    data: result,
  });
});

const login = catchAsync(async (req, res) => {
  const { accessToken, refresh, user } = await AuthService.login(req.user!);

  // The refresh token lives only in the httpOnly cookie, never in the body
  res.cookie(REFRESH_COOKIE, refresh.token, refreshCookieOptions(refresh.expiresAt));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Logged in successfully',
    data: { accessToken, user },
  });
});

const refreshToken = catchAsync(async (req, res) => {
  try {
    const { accessToken, refresh } = await AuthService.refreshToken(req.cookies[REFRESH_COOKIE]);
    res.cookie(REFRESH_COOKIE, refresh.token, refreshCookieOptions(refresh.expiresAt));

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Token refreshed',
      data: { accessToken },
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

export const AuthController = { register, login, refreshToken, logout };
