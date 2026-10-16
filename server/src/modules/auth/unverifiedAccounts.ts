import type { Prisma } from '../../../generated/prisma/client';

/**
 * An unverified account can never log in, so it holds nothing of value. Removes the
 * users and every organization they are the only member of (an unverified user can't
 * have invited anyone, so their own organization has no one else). Cascades remove
 * memberships, subscriptions, tokens and outbox rows.
 */
export async function removeUnverifiedAccounts(tx: Prisma.TransactionClient, userIds: string[]) {
  if (userIds.length === 0) return { users: 0, organizations: 0 };

  const memberships = await tx.membership.findMany({
    where: { userId: { in: userIds } },
    select: {
      organizationId: true,
      organization: { select: { _count: { select: { memberships: true } } } },
    },
  });
  const soleOrgIds = memberships
    .filter((m) => m.organization._count.memberships === 1)
    .map((m) => m.organizationId);

  const organizations = await tx.organization.deleteMany({ where: { id: { in: soleOrgIds } } });
  const users = await tx.user.deleteMany({
    where: { id: { in: userIds }, emailVerifiedAt: null },
  });
  return { users: users.count, organizations: organizations.count };
}
