import type { Prisma } from '../../generated/prisma/client';
import config from '../config';
import { mailer } from '../lib/mailer';
import { prisma } from '../lib/prisma';
import { renderEmail } from '../modules/email/email.templates';
import type { JobResult } from './registry';

const MAX_ATTEMPTS = 5; // FR-MAIL-03
const BATCH_SIZE = 50;
// Secrets inside the payload (e.g. invitation links) are removed once delivered
const SENSITIVE_KEYS = ['link'];
// Reserved for documentation and testing (RFC 2606/6761): the demo and sample accounts
// use them, and no mail server would accept them, so they are marked done unsent
const UNDELIVERABLE = /@([a-z0-9-]+\.)*(example|invalid)$|@example\.(com|net|org)$/i;

let running = false;

/**
 * Sends queued emails. Safe to run concurrently (node-cron, the scheduled job route and
 * the after-invite trigger may overlap, possibly on different instances): each row is
 * claimed by atomically bumping `attempts` from the value we read, so only one worker
 * sends it. When nothing is queued this costs a single query.
 */
export async function sendEmails(): Promise<JobResult> {
  if (running) return { sent: 0, failed: 0, skipped: 'already running in this instance' };
  running = true;
  const startedAt = Date.now();
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  try {
    const batch = await prisma.emailOutbox.findMany({
      where: { status: { in: ['PENDING', 'FAILED'] }, attempts: { lt: MAX_ATTEMPTS } },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE,
    });

    for (const email of batch) {
      const claim = await prisma.emailOutbox.updateMany({
        where: { id: email.id, attempts: email.attempts, status: { not: 'SENT' } },
        data: { attempts: { increment: 1 } },
      });
      if (claim.count === 0) continue; // another worker took it

      if (UNDELIVERABLE.test(email.toEmail)) {
        await prisma.emailOutbox.update({
          where: { id: email.id },
          data: { status: 'SENT', sentAt: new Date(), lastError: 'Not sent: reserved test domain' },
        });
        skipped++;
        continue;
      }

      try {
        const { subject, text, html } = renderEmail(email.template, email.data);
        await mailer.sendMail({ from: config.mail.from, to: email.toEmail, subject, text, html });

        const data = { ...(email.data as Prisma.JsonObject) };
        for (const key of SENSITIVE_KEYS) if (key in data) data[key] = '[redacted after send]';

        await prisma.emailOutbox.update({
          where: { id: email.id },
          data: { status: 'SENT', sentAt: new Date(), lastError: null, data },
        });
        sent++;
      } catch (err) {
        await prisma.emailOutbox.update({
          where: { id: email.id },
          data: { status: 'FAILED', lastError: (err as Error).message.slice(0, 500) },
        });
        failed++;
      }
    }

    // Counts only: logs never contain addresses, links, tokens or payloads (NFR-SEC-08)
    if (batch.length > 0) {
      console.info(
        `[send-emails] done in ${Date.now() - startedAt}ms: ${sent} sent, ${failed} failed, ${skipped} to test domains not sent`,
      );
    }
    return { sent, failed, notSent: skipped };
  } finally {
    running = false;
  }
}
