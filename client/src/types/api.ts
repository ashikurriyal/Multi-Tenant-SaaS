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
