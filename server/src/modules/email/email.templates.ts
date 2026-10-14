import { z } from 'zod';

// FR-MAIL-02 — payment templates are added with billing (Phase 2)
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const invitationData = z.object({
  organizationName: z.string(),
  inviterName: z.string(),
  role: z.string(),
  link: z.string(),
  expiresAt: z.string(),
});

const templates = {
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
