import { cleanup } from './cleanup';
import { reconcileStripe } from './reconcileStripe';
import { retryWebhooks } from './retryWebhooks';
import { sendEmails } from './sendEmails';

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
  { name: 'reconcile-stripe', schedule: '0 1 * * *', run: reconcileStripe }, // daily 01:00 UTC
  { name: 'cleanup', schedule: '15 3 * * *', run: cleanup }, // daily 03:15 UTC
];

export const findJob = (name: string) => jobs.find((job) => job.name === name);
