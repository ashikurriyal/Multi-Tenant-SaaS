/**
 * `prisma migrate deploy` for the API's Vercel build (npm run db:deploy).
 *
 * Prisma takes a Postgres advisory lock while migrating, so two deploys can't apply the
 * same migration at once. When two builds overlap (e.g. a merge to main plus a manual
 * Redeploy), the second one gives up after 10 s with P1002 "Timed out trying to acquire
 * a postgres advisory lock". Instead of failing the build, wait and try again: by then the
 * other build has finished, and its migrations are simply "already applied".
 * Any other error fails immediately.
 */
import { spawnSync } from 'node:child_process';

const ATTEMPTS = 4;
const WAIT_SECONDS = 20;
const LOCK_BUSY = /P1002|advisory lock/i;

const sleep = (seconds) =>
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, seconds * 1000);

for (let attempt = 1; ; attempt++) {
  const run = spawnSync('npx', ['prisma', 'migrate', 'deploy'], { encoding: 'utf8' });
  process.stdout.write(run.stdout ?? '');
  process.stderr.write(run.stderr ?? '');
  if (run.status === 0) process.exit(0);

  const lockBusy = LOCK_BUSY.test(`${run.stdout}${run.stderr}`);
  if (!lockBusy || attempt === ATTEMPTS) process.exit(run.status ?? 1);

  console.info(
    `\nAnother deploy is applying migrations (lock busy). Retrying in ${WAIT_SECONDS}s (${attempt}/${ATTEMPTS - 1})…\n`,
  );
  sleep(WAIT_SECONDS);
}
