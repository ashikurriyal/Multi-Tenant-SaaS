// Shapes of the LedgerFlow API (SRS section 10.1)

export type ApiMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiResponse<T> = {
  success: true;
  statusCode: number;
  message: string;
  meta?: ApiMeta;
  data: T;
};

export type ApiErrorDetail = { path: string; message: string };

export type ApiErrorBody = {
  success: false;
  statusCode: number;
  message: string;
  errorCode: string;
  errorDetails: ApiErrorDetail[];
};

export type PlatformRole = "USER" | "SUPER_ADMIN";
export type OrgRole = "OWNER" | "ADMIN" | "BILLING" | "MEMBER";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  platformRole: PlatformRole;
};

export type Me = AuthUser & {
  createdAt: string;
  memberships: {
    id: string;
    role: OrgRole;
    organization: { id: string; name: string; slug: string };
  }[];
};

export type Entitlements = {
  planCode: string;
  status: string;
  accessLevel: "FULL" | "FREE";
  seatLimit: number;
  seatsUsed: number;
  includedUnits: number;
  overageAllowed: boolean;
};

export type OrganizationDetails = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  myRole: OrgRole;
  entitlements: Entitlements;
};

export type Member = {
  id: string; // membership id
  role: OrgRole;
  createdAt: string;
  user: { id: string; name: string; email: string };
};

export type InvitableRole = Exclude<OrgRole, "OWNER">;

export type PendingInvitation = {
  id: string;
  email: string;
  role: InvitableRole;
  expiresAt: string;
  createdAt: string;
  invitedBy: { id: string; name: string };
};

// GET /invitations/:token (public)
export type PublicInvitation = {
  email: string;
  role: InvitableRole;
  expiresAt: string;
  organization: { name: string };
  invitedBy: string;
};
