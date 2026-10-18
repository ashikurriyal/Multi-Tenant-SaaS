import { prisma } from '../../lib/prisma';
import type { TenantPrisma } from '../../lib/tenantPrisma';
import { buildMeta, toSkipTake } from '../../utils/pagination';
import { AUDIT_CATEGORIES, type TAuditListQuery } from './audit.validation';

/**
 * FR-AUD-03, endpoint #32: the organization's audit log, newest first. `actor` is null
 * when Stripe or a scheduled job made the change; `subject` is the member a membership
 * entry is about. Rows are only ever read here; they are
 * written by recordAudit inside the transaction of the change they describe (FR-AUD-02).
 */
const listAuditLogs = async (db: TenantPrisma, query: TAuditListQuery) => {
  const where = query.category
    ? { OR: AUDIT_CATEGORIES[query.category].map((prefix) => ({ action: { startsWith: prefix } })) }
    : {};

  const [rows, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      ...toSkipTake(query),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        before: true,
        after: true,
        createdAt: true,
        // The actor may have left the organization since; the history keeps their name
        actor: { select: { id: true, name: true, email: true } },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  // Membership entries store the affected user's id; resolve them to names in one query,
  // so the timeline can say whose role changed even after that person has left
  const userIdOf = (json: unknown) =>
    json && typeof json === 'object' && 'userId' in json && typeof json.userId === 'string'
      ? json.userId
      : null;
  const subjectIds = [
    ...new Set(rows.flatMap((r) => [userIdOf(r.before), userIdOf(r.after)]).filter(Boolean)),
  ] as string[];
  const subjects = subjectIds.length
    ? await prisma.user.findMany({
        where: { id: { in: subjectIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const subjectById = new Map(subjects.map((u) => [u.id, u]));

  // BigInt ids can't go through JSON.stringify
  const data = rows.map((row) => {
    const subjectId = userIdOf(row.after) ?? userIdOf(row.before);
    return {
      ...row,
      id: row.id.toString(),
      subject: subjectId ? (subjectById.get(subjectId) ?? null) : null,
    };
  });
  return { data, meta: buildMeta(query, total) };
};

export const AuditService = { listAuditLogs };
