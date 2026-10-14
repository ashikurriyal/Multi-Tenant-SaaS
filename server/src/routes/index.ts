import { Router } from 'express';

const router = Router();

// Each feature module adds its router here, e.g. { path: '/auth', route: AuthRoutes }
const moduleRoutes: { path: string; route: Router }[] = [];

moduleRoutes.forEach(({ path, route }) => router.use(path, route));

export default router;
