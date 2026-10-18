import { Router } from 'express';
import { JobRoutes } from '../jobs/jobs.route';
import { AdminRoutes } from '../modules/admin/admin.route';
import { AuthRoutes } from '../modules/auth/auth.route';
import { DemoRoutes } from '../modules/demo/demo.route';
import { InvitationRoutes } from '../modules/invitation/invitation.route';
import { OrganizationRoutes } from '../modules/organization/organization.route';
import { PlanRoutes } from '../modules/plan/plan.route';
import { UsageRoutes } from '../modules/usage/usage.route';
import { UserRoutes } from '../modules/user/user.route';

const router = Router();

// Each feature module adds its router here, e.g. { path: '/auth', route: AuthRoutes }
const moduleRoutes: { path: string; route: Router }[] = [
  { path: '/auth', route: AuthRoutes },
  { path: '/demo', route: DemoRoutes },
  { path: '/users', route: UserRoutes },
  { path: '/orgs', route: OrganizationRoutes },
  { path: '/invitations', route: InvitationRoutes },
  { path: '/plans', route: PlanRoutes },
  { path: '/usage', route: UsageRoutes },
  { path: '/admin', route: AdminRoutes },
  { path: '/internal/jobs', route: JobRoutes },
];

moduleRoutes.forEach(({ path, route }) => router.use(path, route));

export default router;
