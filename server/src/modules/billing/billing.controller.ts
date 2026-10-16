import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import type { TPagination } from '../../utils/pagination';
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

const previewPlanChange = catchAsync(async (req, res) => {
  const { db, id } = req.org!;
  const result = await BillingService.previewPlanChange(db, id, req.body.planCode);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Plan change preview',
    data: result,
  });
});

const changePlan = catchAsync(async (req, res) => {
  const { db, id } = req.org!;
  const result = await BillingService.changePlan(db, id, req.user!, {
    planCode: req.body.planCode,
    prorationDate: req.body.prorationDate,
    idempotencyKey: req.get('idempotency-key')!,
  });

  // 202: Stripe has accepted it; the plan switches when the webhook confirms
  sendResponse(res, {
    statusCode: httpStatus.ACCEPTED,
    message: 'Plan change submitted',
    data: result,
  });
});

const listInvoices = catchAsync(async (req, res) => {
  const { data, meta } = await BillingService.listInvoices(
    req.org!.db,
    req.query as unknown as TPagination,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Invoices retrieved successfully',
    meta,
    data,
  });
});

export const BillingController = {
  getSubscription,
  createCheckoutSession,
  createPortalSession,
  previewPlanChange,
  changePlan,
  listInvoices,
};
