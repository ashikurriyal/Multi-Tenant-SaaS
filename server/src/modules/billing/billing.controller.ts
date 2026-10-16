import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { BillingService } from './billing.service';

const getSubscription = catchAsync(async (req, res) => {
  const { db, id } = req.org!;
  const result = await BillingService.getSubscription(db, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Subscription retrieved successfully',
    data: result,
  });
});

const createCheckoutSession = catchAsync(async (req, res) => {
  const { db, id } = req.org!;
  const result = await BillingService.createCheckoutSession(db, id, req.user!, req.body.planCode);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Checkout session created',
    data: result,
  });
});

const createPortalSession = catchAsync(async (req, res) => {
  const { db, id } = req.org!;
  const result = await BillingService.createPortalSession(db, id);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Billing portal session created',
    data: result,
  });
});

export const BillingController = { getSubscription, createCheckoutSession, createPortalSession };
