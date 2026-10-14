import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.route';
import { OrganizationRoutes } from '../modules/organization/organization.route';
import { UserRoutes } from '../modules/user/user.route';

const router = Router();

// Each feature module adds its router here, e.g. { path: '/auth', route: AuthRoutes }
const moduleRoutes: { path: string; route: Router }[] = [
  { path: '/auth', route: AuthRoutes },
  { path: '/users', route: UserRoutes },
  { path: '/orgs', route: OrganizationRoutes },
];

moduleRoutes.forEach(({ path, route }) => router.use(path, route));

export default router;
