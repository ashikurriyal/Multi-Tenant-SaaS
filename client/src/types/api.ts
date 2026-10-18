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

export type Plan = {
  code: "FREE" | "PRO" | "BUSINESS";
  name: string;
  monthlyPriceCents: number;
  seatLimit: number;
  includedUnits: number;
  overageUnitMicros: number;
};

export type SubscriptionStatus =
  "INCOMPLETE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "UNPAID" | "CANCELED";

export type BillingSubscription = {
  plan: Plan;
  status: SubscriptionStatus;
  accessLevel: "FULL" | "FREE";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  graceEndsAt: string | null;
  isPaidPlan: boolean;
  hasBillingAccount: boolean;
};

export type PlanChangePreview = {
  currentPlan: { code: string; name: string };
  targetPlan: { code: string; name: string; monthlyPriceCents: number };
  isUpgrade: boolean;
  amountDueNowCents: number;
  currency: string;
  nextMonthlyCents: number;
  prorationDate: number;
};

export type Invoice = {
  id: string;
  status: "DRAFT" | "OPEN" | "PAID" | "UNCOLLECTIBLE" | "VOID";
  amountDueCents: number;
  amountPaidCents: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
  hostedInvoiceUrl: string | null;
  createdAt: string;
};

// GET /orgs/:orgId/usage/summary (endpoint #30)
export type UsageSummary = {
  planCode: string;
  periodStart: string;
  periodEnd: string;
  unitsUsed: number;
  includedUnits: number;
  percentUsed: number;
  overageAllowed: boolean;
  limitReached: boolean;
  overageCents: number;
  projectedUnits: number;
  projectedOverageCents: number;
};

// GET /orgs/:orgId/usage/daily (endpoint #31); days are UTC, YYYY-MM-DD
export type DailyUsage = {
  from: string;
  to: string;
  metric: string | null;
  metrics: string[];
  totalUnits: number;
  days: { day: string; units: number }[];
};

export type ApiKey = {
  id: string;
  name: string;
  prefix: string; // e.g. lf_live_3Hq9
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
};

// POST /orgs/:orgId/api-keys — the only time the full key is returned
export type CreatedApiKey = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  key: string;
};

// ---- Super admin (endpoints #34–#37) ----

export type MrrMonth = {
  month: string; // YYYY-MM
  asOf: string | null; // snapshot day used as the month's end; null = no data yet
  mrrCents: number;
  payingCustomers: number;
  newCents: number;
  expansionCents: number;
  contractionCents: number;
  churnedCents: number;
  reactivationCents: number;
  netNewCents: number;
};

export type ChurnMonth = {
  month: string;
  asOf: string | null;
  startCustomers: number;
  endCustomers: number;
  churnedCustomers: number;
  customerChurnPercent: number | null;
  startMrrCents: number;
  mrrCents: number;
  nrrPercent: number | null;
  arpaCents: number | null;
};

export type AdminTenant = {
  id: string;
  name: string;
  slug: string;
  isDemo: boolean; // sample data from `npm run seed:demo`
  createdAt: string;
  planCode: string;
  planName: string;
  status: SubscriptionStatus;
  accessLevel: "FULL" | "FREE";
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  memberCount: number;
  mrrCents: number;
};

export type WebhookEventStatus = "RECEIVED" | "PROCESSING" | "PROCESSED" | "FAILED";

export type AdminWebhookEvent = {
  id: string; // evt_…
  type: string;
  status: WebhookEventStatus;
  attempts: number;
  lastError: string | null;
  nextAttemptAt: string | null;
  receivedAt: string;
  processedAt: string | null;
};
