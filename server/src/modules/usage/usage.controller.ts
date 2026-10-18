import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UsageService } from './usage.service';
import type { TDailyQuery } from './usage.validation';

// 202: accepted for billing; it is reported to Stripe's meter by a job, not now
const ingest = catchAsync(async (req, res) => {
  const result = await UsageService.recordUsage(req.apiKey!, req.body);
  sendResponse(res, {
    statusCode: httpStatus.ACCEPTED,
    message: result.duplicate ? 'Already recorded' : 'Usage recorded',
    data: result,
  });
});

const getSummary = catchAsync(async (req, res) => {
  const result = await UsageService.getSummary(req.org!.db);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Usage summary retrieved',
    data: result,
  });
});

const getDaily = catchAsync(async (req, res) => {
  const result = await UsageService.getDaily(req.org!.db, req.query as TDailyQuery);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Daily usage retrieved',
    data: result,
  });
});

export const UsageController = { ingest, getSummary, getDaily };
