import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PlanService } from './plan.service';

const listPlans = catchAsync(async (_req, res) => {
  const plans = await PlanService.listActivePlans();
  // Same for every visitor and rarely changes: let browsers and Vercel's CDN cache it
  res.set('Cache-Control', 'public, max-age=300, s-maxage=300');

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Plans retrieved successfully',
    data: plans,
  });
});

export const PlanController = { listPlans };
