import { z } from 'zod';

// FR-MAIL-02 — payment templates are added with billing (Phase 2); FR-AUTH-12..16 for links
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const invitationData = z.object({
  organizationName: z.string(),
  inviterName: z.string(),
  role: z.string(),
  link: z.string(),
  expiresAt: z.string(),
});

const linkData = z.object({ name: z.string(), link: z.string(), expiresAt: z.string() });

const billingData = z.object({
  organizationName: z.string(),
  planName: z.string(),
  link: z.string(),
  date: z.string().nullish(), // grace end, trial end or access end, depending on the email
});

const day = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : null;

const billingEmail = (subject: string, lines: string[], cta: string, link: string) => ({
  subject,
  text: `${lines.join('\n\n')}\n\n${cta}: ${link}`,
  html: `${lines.map((l) => `<p>${escapeHtml(l)}</p>`).join('')}<p><a href="${escapeHtml(link)}">${escapeHtml(cta)}</a></p>`,
});

const templates = {
  // FR-MAIL-02 billing emails (SRS 12.2). Sent to Owners and Billing members
  payment_failed: (raw: unknown) => {
    const d = billingData.parse(raw);
    const until = day(d.date);
    return billingEmail(
      `Payment failed for ${d.organizationName}`,
      [
        `We couldn't charge the card on file for ${d.organizationName}'s ${d.planName} plan.`,
        until
          ? `Your team keeps full access until ${until}. After that the organization moves to Free limits until the payment goes through.`
          : 'Please update the payment method to keep your plan.',
      ],
      'Update payment method',
      d.link,
    );
  },
  payment_recovered: (raw: unknown) => {
    const d = billingData.parse(raw);
    return billingEmail(
      `Payment received for ${d.organizationName}`,
      [
        `Thanks — the payment went through and ${d.organizationName} is back on ${d.planName} with full access.`,
      ],
      'View billing',
      d.link,
    );
  },
  subscription_canceled: (raw: unknown) => {
    const d = billingData.parse(raw);
    return billingEmail(
      `${d.organizationName}'s ${d.planName} plan has ended`,
      [
        `The ${d.planName} subscription for ${d.organizationName} has ended, and the organization is now on the Free plan.`,
        'You can subscribe again at any time.',
      ],
      'Choose a plan',
      d.link,
    );
  },
  trial_will_end: (raw: unknown) => {
    const d = billingData.parse(raw);
    const end = day(d.date);
    return billingEmail(
      `${d.organizationName}'s trial ends ${end ? `on ${end}` : 'soon'}`,
      [
        `The ${d.planName} trial for ${d.organizationName} ends ${end ? `on ${end}` : 'soon'}.`,
        'Add a payment method to keep your plan without interruption.',
      ],
      'Add a payment method',
      d.link,
    );
  },

  verify_email: (raw: unknown) => {
    const d = linkData.parse(raw);
    const name = escapeHtml(d.name);
    const expires = new Date(d.expiresAt).toUTCString();
    return {
      subject: 'Verify your email for LedgerFlow',
      text: `Hi ${d.name},\n\nConfirm your email address to start using LedgerFlow: ${d.link}\n\nThis link expires on ${expires}. If you didn't create an account, you can ignore this email.`,
      html: `<p>Hi ${name},</p><p>Confirm your email address to start using LedgerFlow.</p><p><a href="${escapeHtml(d.link)}">Verify email</a></p><p style="color:#666">This link expires on ${expires}. If you didn't create an account, you can ignore this email.</p>`,
    };
  },
  reset_password: (raw: unknown) => {
    const d = linkData.parse(raw);
    const name = escapeHtml(d.name);
    const expires = new Date(d.expiresAt).toUTCString();
    return {
      subject: 'Reset your LedgerFlow password',
      text: `Hi ${d.name},\n\nSomeone asked to reset the password for your LedgerFlow account. Set a new one here: ${d.link}\n\nThis link expires on ${expires}. If it wasn't you, ignore this email; your password stays the same.`,
      html: `<p>Hi ${name},</p><p>Someone asked to reset the password for your LedgerFlow account.</p><p><a href="${escapeHtml(d.link)}">Set a new password</a></p><p style="color:#666">This link expires on ${expires}. If it wasn't you, ignore this email; your password stays the same.</p>`,
    };
  },

  invitation: (raw: unknown) => {
    const d = invitationData.parse(raw);
    const org = escapeHtml(d.organizationName);
    const inviter = escapeHtml(d.inviterName);
    const role = d.role.toLowerCase();
    const expires = new Date(d.expiresAt).toUTCString();
    return {
      subject: `${d.inviterName} invited you to join ${d.organizationName} on LedgerFlow`,
      text: `${d.inviterName} invited you to join ${d.organizationName} as ${role}.\n\nAccept the invitation: ${d.link}\n\nThis link expires on ${expires}.`,
      html: `<p><strong>${inviter}</strong> invited you to join <strong>${org}</strong> on LedgerFlow as <strong>${role}</strong>.</p><p><a href="${escapeHtml(d.link)}">Accept the invitation</a></p><p style="color:#666">This link expires on ${expires}.</p>`,
    };
  },
};

export type EmailTemplate = keyof typeof templates;

export const renderEmail = (template: string, data: unknown) => {
  const render = templates[template as EmailTemplate];
  if (!render) throw new Error(`Unknown email template: ${template}`);
  return render(data);
};
