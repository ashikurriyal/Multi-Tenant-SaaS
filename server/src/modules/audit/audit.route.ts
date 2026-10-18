import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { AuditController } from './audit.controller';
import { AuditValidation } from './audit.validation';

// Mounted at /orgs/:orgId/audit-logs after auth + requireOrgMember + audit:read
const router = Router({ mergeParams: true });

router.get('/', validateRequest(AuditValidation.list), AuditController.listAuditLogs);

export const AuditRoutes = router;
