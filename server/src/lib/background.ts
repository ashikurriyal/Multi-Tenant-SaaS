import { waitUntil } from '@vercel/functions';

/**
 * Runs work after the response has been sent. On Vercel, waitUntil keeps the function
 * alive until the promise settles; on a long-lived server the promise simply runs on.
 * Failures are logged, never thrown at the request that triggered them.
 */
export function runInBackground(label: string, task: () => Promise<unknown>) {
  const promise = task().catch((err) => console.error(`[${label}] failed:`, err));
  waitUntil(promise);
}
