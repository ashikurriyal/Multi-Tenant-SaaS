import type { Prisma } from '../../../generated/prisma/client';
import type { EmailTemplate } from './email.templates';

type TOutboxClient = {
  emailOutbox: {
    create: (args: { data: Prisma.EmailOutboxUncheckedCreateInput }) => Promise<unknown>;
  };
};

// FR-MAIL-01: call with the transaction client so the email is queued together with
// the change that causes it. The send-emails job delivers it.
export const queueEmail = (
  client: TOutboxClient,
  email: {
    organizationId: string | null;
    toEmail: string;
    template: EmailTemplate;
    data: Prisma.InputJsonObject;
  },
) => client.emailOutbox.create({ data: email });
