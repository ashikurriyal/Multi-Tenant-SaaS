import { prisma } from './prisma';

// Every model with an organizationId column (SRS section 16.3)
const TENANT_MODELS = new Set([
  'Membership',
  'Invitation',
  'Subscription',
  'Invoice',
  'ApiKey',
  'UsageEvent',
  'UsageCounter',
  'UsageDailyRollup',
  'MrrSnapshot',
  'AuditLog',
  'EmailOutbox',
]);

const WHERE_OPS = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'updateManyAndReturn',
  'delete',
  'deleteMany',
  'upsert',
]);
const CREATE_OPS = new Set(['create', 'createMany', 'createManyAndReturn']);
const UPDATE_OPS = new Set(['update', 'updateMany', 'updateManyAndReturn']);

type TArgs = {
  where?: Record<string, unknown>;
  data?: Record<string, unknown> | Record<string, unknown>[];
  create?: Record<string, unknown>;
  update?: Record<string, unknown>;
};

// Adds the tenant condition without replacing the caller's own condition on that field:
// asking for another tenant's row then matches nothing instead of silently hitting ours
const scopeWhere = (where: TArgs['where'], field: string, value: string) => {
  if (!where || !(field in where)) return { ...where, [field]: value };
  const and = where.AND === undefined ? [] : [where.AND].flat();
  return { ...where, [field]: value, AND: [...and, { [field]: where[field] }] };
};

const withOrg = (data: TArgs['data'], organizationId: string) =>
  Array.isArray(data) ? data.map((d) => ({ ...d, organizationId })) : { ...data, organizationId };

/**
 * A Prisma client that can only see and write one organization's rows.
 * Rules: write `organizationId` as a plain field (never `organization: { connect }`),
 * and don't reach tenant tables through nested includes of global models (e.g. User).
 */
export function tenantPrisma(organizationId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const a = (args ?? {}) as TArgs;

          // The organization itself: only its own row, never created or deleted from here
          if (model === 'Organization') {
            if (CREATE_OPS.has(operation) || operation.startsWith('delete')) {
              throw new Error(`Organization.${operation} is not allowed on a tenant client`);
            }
            if (WHERE_OPS.has(operation)) a.where = scopeWhere(a.where, 'id', organizationId);
            return query(a as typeof args);
          }

          if (!TENANT_MODELS.has(model)) return query(args);

          if (WHERE_OPS.has(operation))
            a.where = scopeWhere(a.where, 'organizationId', organizationId);
          if (CREATE_OPS.has(operation)) a.data = withOrg(a.data, organizationId);
          // Pin organizationId on updates so a row can never be moved to another tenant
          if (UPDATE_OPS.has(operation)) a.data = withOrg(a.data, organizationId);
          if (operation === 'upsert') {
            a.create = { ...a.create, organizationId };
            a.update = { ...a.update, organizationId };
          }

          return query(a as typeof args);
        },
      },
    },
  });
}

export type TenantPrisma = ReturnType<typeof tenantPrisma>;
