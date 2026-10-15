import config from '../../config';
import AppError from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import { tenantPrisma, type TenantPrisma } from '../../lib/tenantPrisma';
import { recordAudit } from '../../shared/audit';
import { countSeatsUsed, getEntitlements } from '../../shared/entitlements';
import { randomToken, sha256 } from '../../utils/hash';
import { queueEmail } from '../email/email.outbox';
import type { TCreateInvitationPayload } from './invitation.validation';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // FR-INV-03
type TTenantTx = Parameters<Parameters<TenantPrisma['$transaction']>[0]>[0];
type TSeatTx = Parameters<typeof countSeatsUsed>[2];

const inviteGone = () =>
  new AppError(410, 'INVITE_EXPIRED', 'This invitation has expired or was already used');
const seatsFull = (limit: number) =>
  new AppError(
    402,
    'PLAN_LIMIT_SEATS',
    `Your plan allows ${limit} seats. Upgrade to invite more members.`,
  );

// Serializes seat-changing operations per organization, so concurrent invites or
// accepts can't both pass the seat check
const lockOrganization = (tx: TTenantTx, organizationId: string) =>
  tx.$queryRaw`SELECT id FROM organizations WHERE id = ${organizationId} FOR UPDATE`;

const listPending = (db: TenantPrisma) =>
  db.invitation.findMany({
    where: { acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      createdAt: true,
      invitedBy: { select: { id: true, name: true } },
    },
  });

// FR-INV-01..03
const createInvitation = (
  db: TenantPrisma,
  organizationId: string,
  inviter: Express.User,
  payload: TCreateInvitationPayload,
) =>
  db.$transaction(async (tx) => {
    await lockOrganization(tx, organizationId);
    const now = new Date();

    const alreadyMember = await tx.membership.findFirst({
      where: { user: { email: payload.email } },
      select: { id: true },
    });
    if (alreadyMember) {
      throw new AppError(409, 'CONFLICT', 'This person is already a member of the organization');
    }

    // Re-inviting the same email replaces the old invitation instead of taking a 2nd seat
    await tx.invitation.deleteMany({ where: { email: payload.email, acceptedAt: null } });

    const { seatLimit } = await getEntitlements(organizationId, now);
    const seatsUsed = await countSeatsUsed(organizationId, now, tx as unknown as TSeatTx);
    if (seatsUsed + 1 > seatLimit) throw seatsFull(seatLimit);

    const token = randomToken();
    const invitation = await tx.invitation.create({
      data: {
        organizationId,
        invitedById: inviter.id,
        email: payload.email,
        role: payload.role,
        tokenHash: sha256(token),
        expiresAt: new Date(now.getTime() + INVITE_TTL_MS),
      },
      select: { id: true, email: true, role: true, expiresAt: true },
    });

    const organization = await tx.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { name: true },
    });
    await queueEmail(tx, {
      organizationId,
      toEmail: payload.email,
      template: 'invitation',
      data: {
        organizationName: organization.name,
        inviterName: inviter.name,
        role: payload.role,
        link: `${config.clientUrl}/invite/${token}`,
        expiresAt: invitation.expiresAt.toISOString(),
      },
    });
    await recordAudit(tx, {
      organizationId,
      actorId: inviter.id,
      action: 'member.invited',
      entityType: 'Invitation',
      entityId: invitation.id,
      after: { email: payload.email, role: payload.role },
    });

    return invitation;
  });

// FR-INV-06
const revokeInvitation = (
  db: TenantPrisma,
  organizationId: string,
  actorId: string,
  invitationId: string,
) =>
  db.$transaction(async (tx) => {
    const invitation = await tx.invitation.findFirst({
      where: { id: invitationId, acceptedAt: null },
      select: { id: true, email: true, role: true },
    });
    if (!invitation) throw new AppError(404, 'NOT_FOUND', 'Invitation not found');

    await tx.invitation.delete({ where: { id: invitation.id } });
    await recordAudit(tx, {
      organizationId,
      actorId,
      action: 'invitation.revoked',
      entityType: 'Invitation',
      entityId: invitation.id,
      before: { email: invitation.email, role: invitation.role },
    });
  });

// Looking up by token crosses tenants by design: the token itself is the credential
const findByToken = async (token: string) => {
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: sha256(token) },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      invitedBy: { select: { name: true } },
    },
  });
  if (!invitation) throw new AppError(404, 'NOT_FOUND', 'Invitation not found');
  if (invitation.acceptedAt || invitation.expiresAt <= new Date()) throw inviteGone();
  return invitation;
};

// Public: what the /invite/<token> page shows before login
const getInvitation = async (token: string) => {
  const invitation = await findByToken(token);
  return {
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    organization: { name: invitation.organization.name },
    invitedBy: invitation.invitedBy.name,
  };
};

// FR-INV-04, FR-INV-05
const acceptInvitation = async (token: string, user: Express.User) => {
  const invitation = await findByToken(token);
  if (invitation.email !== user.email.toLowerCase()) {
    throw new AppError(
      403,
      'INVITE_EMAIL_MISMATCH',
      `This invitation was sent to a different email address. Log in as ${invitation.email} to accept it.`,
    );
  }

  const { organization } = invitation;
  const db = tenantPrisma(organization.id);

  return db.$transaction(async (tx) => {
    await lockOrganization(tx, organization.id);
    const now = new Date();

    // Claim the invitation atomically: a double click or a 2nd tab can't accept twice
    const { count } = await tx.invitation.updateMany({
      where: { id: invitation.id, acceptedAt: null, expiresAt: { gt: now } },
      data: { acceptedAt: now },
    });
    if (count === 0) throw inviteGone();

    const existing = await tx.membership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: organization.id } },
    });
    if (existing) throw new AppError(409, 'CONFLICT', 'You are already a member');

    // The plan may have been downgraded since the invitation was sent
    const { seatLimit } = await getEntitlements(organization.id, now);
    const seatsUsed = await countSeatsUsed(organization.id, now, tx as unknown as TSeatTx);
    if (seatsUsed + 1 > seatLimit) throw seatsFull(seatLimit);

    const membership = await tx.membership.create({
      data: { organizationId: organization.id, userId: user.id, role: invitation.role },
    });
    await recordAudit(tx, {
      organizationId: organization.id,
      actorId: user.id,
      action: 'member.joined',
      entityType: 'Membership',
      entityId: membership.id,
      after: { userId: user.id, role: invitation.role, invitationId: invitation.id },
    });

    return { ...organization, role: membership.role };
  });
};

export const InvitationService = {
  listPending,
  createInvitation,
  revokeInvitation,
  getInvitation,
  acceptInvitation,
};
