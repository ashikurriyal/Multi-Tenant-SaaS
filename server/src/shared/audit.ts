import type { Prisma } from '../../generated/prisma/client';

export type TAuditEntry = {
  organizationId: string | null;
  actorId: string | null; // null when the actor is Stripe or a system job
  action: string; // e.g. member.role_changed
  entityType: string;
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
};

type TAuditClient = {
  auditLog: { create: (args: { data: Prisma.AuditLogUncheckedCreateInput }) => Promise<unknown> };
};

// FR-AUD-02: audit rows are only ever inserted. Pass the transaction client so the
// audit row commits or rolls back together with the change it describes.
export const recordAudit = (client: TAuditClient, entry: TAuditEntry) =>
  client.auditLog.create({ data: entry });
