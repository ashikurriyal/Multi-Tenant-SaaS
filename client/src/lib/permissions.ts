import type { OrgRole } from "@/types/api";

// SRS section 8.3 — keep in sync with server/src/shared/permissions.ts.
// Only hides actions in the UI; the API enforces every permission.
export const PERMISSIONS = [
  "usage:read",
  "members:read",
  "members:manage",
  "apikeys:manage",
  "org:update",
  "audit:read",
  "billing:read",
  "billing:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<OrgRole, readonly Permission[]> = {
  OWNER: PERMISSIONS,
  ADMIN: [
    "usage:read",
    "members:read",
    "members:manage",
    "apikeys:manage",
    "org:update",
    "audit:read",
    "billing:read",
  ],
  BILLING: ["usage:read", "members:read", "billing:read", "billing:manage"],
  MEMBER: ["usage:read", "members:read"],
};

export const can = (role: OrgRole | null | undefined, permission: Permission) =>
  Boolean(role && ROLE_PERMISSIONS[role].includes(permission));

// Only an Owner may grant or remove the Owner role
export const canAssignRole = (actorRole: OrgRole, fromRole: OrgRole | null, toRole: OrgRole) =>
  actorRole === "OWNER" || (fromRole !== "OWNER" && toRole !== "OWNER");
