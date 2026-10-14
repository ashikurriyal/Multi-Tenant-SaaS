import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.route';

const router = Router();

// Each feature module adds its router here, e.g. { path: '/auth', route: AuthRoutes }
const moduleRoutes: { path: string; route: Router }[] = [{ path: '/auth', route: AuthRoutes }];

moduleRoutes.forEach(({ path, route }) => router.use(path, route));

export default router;
