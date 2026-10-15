import AppError from '../errors/AppError';
import { prisma } from '../lib/prisma';
import { tenantPrisma } from '../lib/tenantPrisma';
import catchAsync from '../utils/catchAsync';

// FR-ORG-02: 404, not 403, so other organizations' existence is never revealed
const requireOrgMember = catchAsync(async (req, _res, next) => {
  const organizationId = String(req.params.orgId ?? '');

  const membership = organizationId
    ? await prisma.membership.findUnique({
        where: { userId_organizationId: { userId: req.user!.id, organizationId } },
        select: { id: true, role: true },
      })
    : null;

  if (!membership) throw new AppError(404, 'ORG_NOT_FOUND', 'Organization not found');

  req.org = {
    id: organizationId,
    role: membership.role,
    membershipId: membership.id,
    db: tenantPrisma(organizationId),
  };
  next();
});

export default requireOrgMember;
