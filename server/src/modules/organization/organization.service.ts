import type { OrgRole } from '../../../generated/prisma/client';
import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import type { TenantPrisma } from '../../lib/tenantPrisma';
import { recordAudit } from '../../shared/audit';
import { getEntitlements } from '../../shared/entitlements';
import { currentFreePeriod, generateUniqueSlug } from './organization.utils';

type TTx = Prisma.TransactionClient;

/**
 * Organization + OWNER membership + FREE subscription (FR-AUTH-01, FR-ORG-01).
 * Runs inside the caller's transaction so registration stays all-or-nothing.
 */
export const createOrganizationWithOwner = async (tx: TTx, userId: string, name: string) => {
  const freePlan = await tx.plan.findUnique({ where: { code: 'FREE' } });
  if (!freePlan) throw new Error('FREE plan is missing, run the seed');

  const slug = await generateUniqueSlug(name, async (candidate) =>
    Boolean(await tx.organization.findUnique({ where: { slug: candidate } })),
  );
  const period = currentFreePeriod();

  const organization = await tx.organization.create({
    data: {
      name,
      slug,
      memberships: { create: { userId, role: 'OWNER' } },
      subscription: {
        create: {
          planId: freePlan.id,
          status: 'ACTIVE',
          currentPeriodStart: period.start,
          currentPeriodEnd: period.end,
        },
      },
    },
    select: { id: true, name: true, slug: true },
  });

  return { ...organization, role: 'OWNER' as OrgRole };
};

const isSlugConflict = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError &&
  err.code === 'P2002' &&
  JSON.stringify(err.meta ?? {}).includes('slug');

// Two organizations with the same name created at the same moment can race for a slug;
// the unique index rejects one, so retry it with a fresh slug
export const withSlugRetry = async <T>(fn: () => Promise<T>, attempts = 3): Promise<T> => {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i >= attempts || !isSlugConflict(err)) throw err;
    }
  }
};

const createOrganization = (userId: string, name: string) =>
  withSlugRetry(() => prisma.$transaction((tx) => createOrganizationWithOwner(tx, userId, name)));

// FR-ORG-03
const getOrganization = async (db: TenantPrisma, organizationId: string, myRole: OrgRole) => {
  const [organization, entitlements] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { id: true, name: true, slug: true, isDemo: true, createdAt: true },
    }),
    getEntitlements(organizationId),
  ]);
  return { ...organization, myRole, entitlements };
};

// FR-ORG-04: the slug never changes after creation
const updateOrganization = (
  db: TenantPrisma,
  organizationId: string,
  actorId: string,
  name: string,
) =>
  db.$transaction(async (tx) => {
    const before = await tx.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { name: true },
    });
    const updated = await tx.organization.update({
      where: { id: organizationId },
      data: { name },
      select: { id: true, name: true, slug: true },
    });
    if (before.name !== name) {
      await recordAudit(tx, {
        organizationId,
        actorId,
        action: 'organization.renamed',
        entityType: 'Organization',
        entityId: organizationId,
        before,
        after: { name },
      });
    }
    return updated;
  });

export const OrganizationService = { createOrganization, getOrganization, updateOrganization };
