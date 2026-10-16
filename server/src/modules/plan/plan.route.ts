import { Router } from 'express';
import { PlanController } from './plan.controller';

const router = Router();

router.get('/', PlanController.listPlans);

export const PlanRoutes = router;
