/**
 * `prisma migrate deploy` for the API's Vercel build (npm run db:deploy).
 *
 * Prisma normally takes a Postgres session lock (pg_advisory_lock) while migrating. Our
 * DATABASE_URL goes through Prisma Postgres's connection pooler, which hands each query to
 * any server connection: the lock is taken on one and the unlock sent to another, so the
 * lock leaks and every later deploy times out with P1002 "Timed out trying to acquire a
 * postgres advisory lock" (reproduced on the dev database). So the lock is turned off.
 *
 * That is safe here because only `main` deploys run migrations (vercel.json skips every
 * other branch), one release at a time. Don't start a Redeploy while another deployment
 * of the API is still building.
 */
import { spawnSync } from 'node:child_process';

const run = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: { ...process.env, PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: '1' },
});
process.exit(run.status ?? 1);
