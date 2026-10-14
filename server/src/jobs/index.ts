import cron from 'node-cron';
import config from '../config';
import { mailDelivery } from '../lib/mailer';
import { sendEmails } from './sendEmails';

// SRS section 13 — every job is idempotent and safe to run twice
const jobs = [{ name: 'send-emails', schedule: '* * * * *', run: sendEmails }];

export function startJobs() {
  if (!config.enableJobs) {
    console.info('[jobs] disabled (ENABLE_JOBS=false)');
    return;
  }

  for (const job of jobs) {
    cron.schedule(
      job.schedule,
      () => {
        job.run().catch((err) => console.error(`[${job.name}] failed:`, err));
      },
      { timezone: 'UTC', name: job.name },
    );
  }
  console.info(`[jobs] started: ${jobs.map((j) => j.name).join(', ')} | email: ${mailDelivery}`);
}

export const stopJobs = () => {
  for (const task of cron.getTasks().values()) task.stop();
};
