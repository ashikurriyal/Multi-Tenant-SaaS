import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { OrganizationService } from './organization.service';

const createOrganization = catchAsync(async (req, res) => {
  const result = await OrganizationService.createOrganization(req.user!.id, req.body.name);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Organization created successfully',
    data: result,
  });
});

const getOrganization = catchAsync(async (req, res) => {
  const { db, id, role } = req.org!;
  const result = await OrganizationService.getOrganization(db, id, role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Organization retrieved successfully',
    data: result,
  });
});

const updateOrganization = catchAsync(async (req, res) => {
  const { db, id } = req.org!;
  const result = await OrganizationService.updateOrganization(db, id, req.user!.id, req.body.name);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Organization updated successfully',
    data: result,
  });
});

export const OrganizationController = { createOrganization, getOrganization, updateOrganization };
