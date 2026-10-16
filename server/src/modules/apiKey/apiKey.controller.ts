import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ApiKeyService } from './apiKey.service';

const listKeys = catchAsync(async (req, res) => {
  const result = await ApiKeyService.listKeys(req.org!.db);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'API keys retrieved successfully',
    data: result,
  });
});

const createKey = catchAsync(async (req, res) => {
  const { db, id } = req.org!;
  const result = await ApiKeyService.createKey(db, id, req.user!.id, req.body.name);
  // The secret must never be cached by a browser or proxy
  res.set('Cache-Control', 'no-store');
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "API key created. Copy it now — it won't be shown again.",
    data: result,
  });
});

const revokeKey = catchAsync(async (req, res) => {
  const { db, id } = req.org!;
  const result = await ApiKeyService.revokeKey(db, id, req.user!.id, String(req.params.keyId));
  sendResponse(res, { statusCode: httpStatus.OK, message: 'API key revoked', data: result });
});

export const ApiKeyController = { listKeys, createKey, revokeKey };
