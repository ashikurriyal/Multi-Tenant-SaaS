import type { OrgRole, PlatformRole } from '../../generated/prisma/client';
import type { TenantPrisma } from '../lib/tenantPrisma';

// Gives req.user and req.org real types everywhere they are set
declare global {
  namespace Express {
    interface User {
      id: string;
      name: string;
      email: string;
      platformRole: PlatformRole;
    }

    interface Request {
      // Set by requireOrgMember on every /orgs/:orgId route
      org?: {
        id: string;
        role: OrgRole;
        membershipId: string;
        db: TenantPrisma;
      };
    }
  }
}

export {};
