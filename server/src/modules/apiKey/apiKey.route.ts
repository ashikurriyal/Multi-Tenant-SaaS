import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { ApiKeyController } from './apiKey.controller';
import { ApiKeyValidation } from './apiKey.validation';

// Mounted at /orgs/:orgId/api-keys after auth + requireOrgMember + apikeys:manage
const router = Router({ mergeParams: true });

router.get('/', ApiKeyController.listKeys);
router.post('/', validateRequest(ApiKeyValidation.create), ApiKeyController.createKey);
router.delete('/:keyId', validateRequest(ApiKeyValidation.revoke), ApiKeyController.revokeKey);

export const ApiKeyRoutes = router;
