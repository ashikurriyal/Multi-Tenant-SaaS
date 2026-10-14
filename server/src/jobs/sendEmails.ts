import type { Prisma } from '../../generated/prisma/client';
import { mailer } from '../lib/mailer';
import { prisma } from '../lib/prisma';
import config from '../config';
import { renderEmail } from '../modules/email/email.templates';

const MAX_ATTEMPTS = 5; // FR-MAIL-03
const BATCH_SIZE = 50;
// Secrets inside the payload (e.g. invitation links) are removed once delivered
const SENSITIVE_KEYS = ['link'];

let running = false;

export async function sendEmails() {
  if (running) return; // a slow run must not overlap the next tick
  running = true;
  const startedAt = Date.now();
  let sent = 0;
  let failed = 0;

  try {
    const batch = await prisma.emailOutbox.findMany({
      where: {
        OR: [{ status: 'PENDING' }, { status: 'FAILED', attempts: { lt: MAX_ATTEMPTS } }],
      },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE,
    });
    if (batch.length === 0) return;

    for (const email of batch) {
      try {
        const { subject, text, html } = renderEmail(email.template, email.data);
        await mailer.sendMail({ from: config.mail.from, to: email.toEmail, subject, text, html });

        const data = { ...(email.data as Prisma.JsonObject) };
        for (const key of SENSITIVE_KEYS) if (key in data) data[key] = '[redacted after send]';

        await prisma.emailOutbox.update({
          where: { id: email.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            attempts: { increment: 1 },
            lastError: null,
            data,
          },
        });
        sent++;
      } catch (err) {
        await prisma.emailOutbox.update({
          where: { id: email.id },
          data: {
            status: 'FAILED',
            attempts: { increment: 1 },
            lastError: (err as Error).message.slice(0, 500),
          },
        });
        failed++;
      }
    }

    // Counts only: logs never contain addresses, links, tokens or payloads (NFR-SEC-08)
    console.info(
      `[send-emails] done in ${Date.now() - startedAt}ms: ${sent} sent, ${failed} failed`,
    );
  } finally {
    running = false;
  }
}
