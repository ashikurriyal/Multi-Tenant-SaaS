import type { TenantPrisma } from '../../lib/tenantPrisma';
import { buildMeta, toSkipTake } from '../../utils/pagination';
import { AUDIT_CATEGORIES, type TAuditListQuery } from './audit.validation';

/**
 * FR-AUD-03, endpoint #32: the organization's audit log, newest first. `actor` is null
 * when Stripe or a scheduled job made the change. Rows are only ever read here; they are
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

  // BigInt ids can't go through JSON.stringify
  const data = rows.map((row) => ({ ...row, id: row.id.toString() }));
  return { data, meta: buildMeta(query, total) };
};

export const AuditService = { listAuditLogs };
