import type { OrgRole } from '../../../generated/prisma/client';
import AppError from '../../errors/AppError';
import type { TenantPrisma } from '../../lib/tenantPrisma';
import { recordAudit } from '../../shared/audit';
import { can, canAssignRole } from '../../shared/permissions';
import { buildMeta, toSkipTake, type TPagination } from '../../utils/pagination';

type TActor = { userId: string; role: OrgRole };
type TTenantTx = Parameters<Parameters<TenantPrisma['$transaction']>[0]>[0];

const memberNotFound = () => new AppError(404, 'NOT_FOUND', 'Member not found');
const forbidden = () => new AppError(403, 'FORBIDDEN', 'You do not have permission to do this');
const lastOwner = () =>
  new AppError(409, 'LAST_OWNER', 'An organization must keep at least one owner');

/**
 * Locks the owner rows until the transaction ends, so two owners demoting or removing
 * each other at the same moment can't leave the organization with none (FR-ORG-06)
 */
const lockOwnerCount = async (tx: TTenantTx, organizationId: string) => {
  const owners = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM memberships
    WHERE "organizationId" = ${organizationId} AND role = 'OWNER'
    FOR UPDATE`;
  return owners.length;
};

const listMembers = async (db: TenantPrisma, pagination: TPagination) => {
  const [members, total] = await Promise.all([
    db.membership.findMany({
      ...toSkipTake(pagination),
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    db.membership.count(),
  ]);
  return { data: members, meta: buildMeta(pagination, total) };
};

// FR-ORG-05, FR-ORG-06, FR-ORG-08
const changeRole = (
  db: TenantPrisma,
  organizationId: string,
  actor: TActor,
  membershipId: string,
  role: OrgRole,
) =>
  db.$transaction(async (tx) => {
    const ownerCount = await lockOwnerCount(tx, organizationId);
    const member = await tx.membership.findUnique({ where: { id: membershipId } });
    if (!member) throw memberNotFound();

    if (!canAssignRole(actor.role, member.role, role)) {
      throw new AppError(403, 'FORBIDDEN', 'Only an owner can grant or remove the owner role');
    }
    if (member.role === role) return member;
    if (member.role === 'OWNER' && ownerCount <= 1) throw lastOwner();

    const updated = await tx.membership.update({ where: { id: membershipId }, data: { role } });
    await recordAudit(tx, {
      organizationId,
      actorId: actor.userId,
      action: 'member.role_changed',
      entityType: 'Membership',
      entityId: membershipId,
      before: { userId: member.userId, role: member.role },
      after: { userId: member.userId, role },
    });
    return updated;
  });

// FR-ORG-05..08: managers remove others; anyone may leave (except the last owner)
const removeMember = (
  db: TenantPrisma,
  organizationId: string,
  actor: TActor,
  membershipId: string,
) =>
  db.$transaction(async (tx) => {
    const ownerCount = await lockOwnerCount(tx, organizationId);
    const member = await tx.membership.findUnique({ where: { id: membershipId } });
    if (!member) throw memberNotFound();

    const isSelf = member.userId === actor.userId;
    if (!isSelf) {
      if (!can(actor.role, 'members:manage')) throw forbidden();
      if (member.role === 'OWNER' && actor.role !== 'OWNER') {
        throw new AppError(403, 'FORBIDDEN', 'Only an owner can remove another owner');
      }
    }
    if (member.role === 'OWNER' && ownerCount <= 1) throw lastOwner();

    await tx.membership.delete({ where: { id: membershipId } });
    await recordAudit(tx, {
      organizationId,
      actorId: actor.userId,
      action: isSelf ? 'member.left' : 'member.removed',
      entityType: 'Membership',
      entityId: membershipId,
      before: { userId: member.userId, role: member.role },
    });
  });

export const MemberService = { listMembers, changeRole, removeMember };
