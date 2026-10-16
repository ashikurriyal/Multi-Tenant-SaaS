import AppError from '../../errors/AppError';
import type { TenantPrisma } from '../../lib/tenantPrisma';
import { recordAudit } from '../../shared/audit';
import { generateApiKey, MAX_ACTIVE_KEYS } from './apiKey.utils';

const listSelect = {
  id: true,
  name: true,
  prefix: true,
  lastUsedAt: true,
  revokedAt: true,
  createdAt: true,
  createdBy: { select: { id: true, name: true } },
} as const;

// FR-KEY-05: active keys first, then revoked ones (kept for the usage history)
const listKeys = (db: TenantPrisma) =>
  db.apiKey.findMany({
    orderBy: [{ revokedAt: { sort: 'desc', nulls: 'first' } }, { createdAt: 'desc' }],
    take: 100,
    select: listSelect,
  });

/**
 * FR-KEY-01…03. The full key is returned only here. The organization row is locked while
 * counting, so two simultaneous requests can't both create the 10th key.
 */
const createKey = (db: TenantPrisma, organizationId: string, actorId: string, name: string) =>
  db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM organizations WHERE id = ${organizationId} FOR UPDATE`;

    const active = await tx.apiKey.count({ where: { revokedAt: null } });
    if (active >= MAX_ACTIVE_KEYS) {
      throw new AppError(
        409,
        'CONFLICT',
        `An organization can have at most ${MAX_ACTIVE_KEYS} active API keys. Revoke one first.`,
      );
    }

    const { key, keyHash, prefix } = generateApiKey();
    const created = await tx.apiKey.create({
      data: { organizationId, createdById: actorId, name, prefix, keyHash },
      select: { id: true, name: true, prefix: true, createdAt: true },
    });
    await recordAudit(tx, {
      organizationId,
      actorId,
      action: 'apikey.created',
      entityType: 'ApiKey',
      entityId: created.id,
      after: { name, prefix },
    });

    return { ...created, key };
  });

// FR-KEY-04: takes effect on the very next request (keys are checked on every request)
const revokeKey = (db: TenantPrisma, organizationId: string, actorId: string, keyId: string) =>
  db.$transaction(async (tx) => {
    const key = await tx.apiKey.findUnique({
      where: { id: keyId },
      select: { id: true, name: true, prefix: true, revokedAt: true },
    });
    if (!key) throw new AppError(404, 'NOT_FOUND', 'API key not found');
    if (key.revokedAt) throw new AppError(409, 'CONFLICT', 'This API key is already revoked');

    const revoked = await tx.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
      select: listSelect,
    });
    await recordAudit(tx, {
      organizationId,
      actorId,
      action: 'apikey.revoked',
      entityType: 'ApiKey',
      entityId: keyId,
      before: { name: key.name, prefix: key.prefix },
    });
    return revoked;
  });

export const ApiKeyService = { listKeys, createKey, revokeKey };
