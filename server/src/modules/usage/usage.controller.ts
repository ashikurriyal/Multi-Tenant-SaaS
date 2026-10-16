import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UsageService } from './usage.service';

// 202: accepted for billing; it is reported to Stripe's meter by a job, not now
const ingest = catchAsync(async (req, res) => {
  const result = await UsageService.recordUsage(req.apiKey!, req.body);
  sendResponse(res, {
    statusCode: httpStatus.ACCEPTED,
    message: result.duplicate ? 'Already recorded' : 'Usage recorded',
    data: result,
  });
});

export const UsageController = { ingest };
