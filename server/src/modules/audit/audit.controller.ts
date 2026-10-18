import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuditService } from './audit.service';
import type { TAuditListQuery } from './audit.validation';

const listAuditLogs = catchAsync(async (req, res) => {
  const { data, meta } = await AuditService.listAuditLogs(
    req.org!.db,
    req.query as unknown as TAuditListQuery,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Audit log retrieved',
    meta,
    data,
  });
});

export const AuditController = { listAuditLogs };
