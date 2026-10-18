import { cleanup } from './cleanup';
import { mrrSnapshot } from './mrrSnapshot';
import { reconcileStripe } from './reconcileStripe';
import { resetDemo } from './resetDemo';
import { reportUsage } from './reportUsage';
import { retryWebhooks } from './retryWebhooks';
import { rollFreePeriods } from './rollFreePeriods';
import { sendEmails } from './sendEmails';
import { usageRollup } from './usageRollup';
import { verifyUsageCounters } from './verifyUsageCounters';

export type JobResult = Record<string, number | string>;

export type Job = {
  name: string;
  // Used by node-cron when the API runs as a long-lived process (local dev, a VM)
  schedule: string;
  run: () => Promise<JobResult>;
};

// SRS section 13 — every job is idempotent and safe to run twice, even concurrently.
// On Vercel there is no long-lived process: an external scheduler calls
// /api/v1/internal/jobs/:name instead (see .github/workflows/scheduled-jobs.yml).
export const jobs: Job[] = [
  { name: 'send-emails', schedule: '* * * * *', run: sendEmails },
  { name: 'retry-webhooks', schedule: '* * * * *', run: retryWebhooks },
  { name: 'report-usage', schedule: '*/5 * * * *', run: reportUsage },
  { name: 'usage-rollup', schedule: '5 * * * *', run: usageRollup }, // hourly at :05
  { name: 'roll-free-periods', schedule: '1 0 * * *', run: rollFreePeriods }, // daily 00:01 UTC
  { name: 'mrr-snapshot', schedule: '15 0 * * *', run: mrrSnapshot }, // daily 00:15 UTC
  { name: 'reconcile-stripe', schedule: '0 1 * * *', run: reconcileStripe }, // daily 01:00 UTC
  { name: 'verify-usage-counters', schedule: '30 1 * * *', run: verifyUsageCounters }, // 01:30
  { name: 'cleanup', schedule: '15 3 * * *', run: cleanup }, // daily 03:15 UTC
  { name: 'reset-demo', schedule: '30 3 * * *', run: resetDemo }, // daily 03:30 UTC
];

export const findJob = (name: string) => jobs.find((job) => job.name === name);
