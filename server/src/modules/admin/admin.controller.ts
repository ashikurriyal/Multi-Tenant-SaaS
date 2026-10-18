import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AdminService } from './admin.service';
import type { TMonthsQuery, TTenantsQuery, TWebhookEventsQuery } from './admin.validation';

const getMrr = catchAsync(async (req, res) => {
  const { months } = req.query as unknown as TMonthsQuery;
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'MRR metrics retrieved',
    data: await AdminService.getMrr(months),
  });
});

const getChurn = catchAsync(async (req, res) => {
  const { months } = req.query as unknown as TMonthsQuery;
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Churn metrics retrieved',
    data: await AdminService.getChurn(months),
  });
});

const listTenants = catchAsync(async (req, res) => {
  const { data, meta } = await AdminService.listTenants(req.query as unknown as TTenantsQuery);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Organizations retrieved',
    meta,
    data,
  });
});

const listWebhookEvents = catchAsync(async (req, res) => {
  const { data, meta } = await AdminService.listWebhookEvents(
    req.query as unknown as TWebhookEventsQuery,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Webhook events retrieved',
    meta,
    data,
  });
});

export const AdminController = { getMrr, getChurn, listTenants, listWebhookEvents };
