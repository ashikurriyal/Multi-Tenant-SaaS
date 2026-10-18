/**
 * Creates (or recreates) the demo organizations and accounts of SRS 21.2 right away,
 * without waiting for the nightly reset-demo job. Paid demos become real Stripe test-mode
 * subscriptions on test clocks when STRIPE_SECRET_KEY and the plan prices are set.
 *
 *   npm run demo:reset -- --yes                                   # database in .env
 *   DATABASE_URL="<ledgerflow-prod string>" npm run demo:reset -- --yes
 *
 * The login-page buttons appear only where DEMO_ENABLED=true is set on the API.
 */
import config from '../src/config';
import { prisma } from '../src/lib/prisma';
import { resetDemo } from '../src/modules/demo/demo.service';

async function main() {
  const url = new URL(config.databaseUrl);
  console.info(`Target database: ${url.hostname} / ${url.pathname.slice(1) || '(default)'}`);
  const local = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  if (!local && !process.argv.includes('--yes')) {
    console.error('Not a local database: re-run with --yes to reset the demo there.');
    process.exitCode = 1;
    return;
  }
  console.info('Resetting the demo (about 30 seconds with Stripe)…');
  console.info('Demo:', JSON.stringify(await resetDemo()));
  if (!config.demoEnabled)
    console.info('Note: DEMO_ENABLED is not true here, so the login buttons stay hidden.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
