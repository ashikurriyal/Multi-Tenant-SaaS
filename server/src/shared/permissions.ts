import type { OrgRole } from '../../generated/prisma/client';

// SRS section 8.3 — keep in sync with client/src/lib/permissions.ts
export const PERMISSIONS = [
  'usage:read',
  'members:read',
  'members:manage',
  'apikeys:manage',
  'org:update',
  'audit:read',
  'billing:read',
  'billing:manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<OrgRole, readonly Permission[]> = {
  OWNER: PERMISSIONS,
  ADMIN: [
    'usage:read',
    'members:read',
    'members:manage',
    'apikeys:manage',
    'org:update',
    'audit:read',
    'billing:read',
  ],
  BILLING: ['usage:read', 'members:read', 'billing:read', 'billing:manage'],
  MEMBER: ['usage:read', 'members:read'],
};

export const can = (role: OrgRole, permission: Permission) =>
  ROLE_PERMISSIONS[role].includes(permission);

// Only an Owner may grant or remove the Owner role
export const canAssignRole = (actorRole: OrgRole, fromRole: OrgRole | null, toRole: OrgRole) =>
  actorRole === 'OWNER' || (fromRole !== 'OWNER' && toRole !== 'OWNER');
