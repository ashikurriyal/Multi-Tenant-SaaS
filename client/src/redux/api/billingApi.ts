import type {
  ApiMeta,
  ApiResponse,
  BillingSubscription,
  Invoice,
  Plan,
  PlanChangePreview,
} from "@/types/api";
import { baseApi } from "./baseApi";

type PaidPlanCode = "PRO" | "BUSINESS";

export const billingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPlans: build.query<Plan[], void>({
      query: () => "/plans",
      transformResponse: (r: ApiResponse<Plan[]>) => r.data,
    }),
    getSubscription: build.query<BillingSubscription, string>({
      query: (orgId) => `/orgs/${orgId}/billing/subscription`,
      transformResponse: (r: ApiResponse<BillingSubscription>) => r.data,
      providesTags: (_r, _e, orgId) => [{ type: "Subscription", id: orgId }],
    }),
    // Redirect to Stripe Checkout; nothing changes here until the webhook (FR-BILL-03)
    createCheckout: build.mutation<{ url: string }, { orgId: string; planCode: PaidPlanCode }>({
      query: ({ orgId, planCode }) => ({
        url: `/orgs/${orgId}/billing/checkout-session`,
        method: "POST",
        body: { planCode },
      }),
      transformResponse: (r: ApiResponse<{ url: string }>) => r.data,
    }),
    createPortal: build.mutation<{ url: string }, string>({
      query: (orgId) => ({ url: `/orgs/${orgId}/billing/portal-session`, method: "POST" }),
      transformResponse: (r: ApiResponse<{ url: string }>) => r.data,
    }),
    previewPlanChange: build.mutation<PlanChangePreview, { orgId: string; planCode: PaidPlanCode }>(
      {
        query: ({ orgId, planCode }) => ({
          url: `/orgs/${orgId}/billing/change-plan/preview`,
          method: "POST",
          body: { planCode },
        }),
        transformResponse: (r: ApiResponse<PlanChangePreview>) => r.data,
      },
    ),
    // One key per "Confirm" dialog: a double click can't change the plan twice (FR-BILL-05)
    changePlan: build.mutation<
      { planCode: string; status: "pending" },
      { orgId: string; planCode: PaidPlanCode; prorationDate: number; idempotencyKey: string }
    >({
      query: ({ orgId, planCode, prorationDate, idempotencyKey }) => ({
        url: `/orgs/${orgId}/billing/change-plan`,
        method: "POST",
        body: { planCode, prorationDate },
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      transformResponse: (r: ApiResponse<{ planCode: string; status: "pending" }>) => r.data,
    }),
    listInvoices: build.query<
      { data: Invoice[]; meta: ApiMeta },
      { orgId: string; page: number; limit: number }
    >({
      query: ({ orgId, page, limit }) => ({
        url: `/orgs/${orgId}/billing/invoices`,
        params: { page, limit },
      }),
      transformResponse: (r: ApiResponse<Invoice[]>) => ({ data: r.data, meta: r.meta! }),
      providesTags: (_r, _e, { orgId }) => [{ type: "Invoices", id: orgId }],
    }),
  }),
});

export const {
  useGetPlansQuery,
  useGetSubscriptionQuery,
  useCreateCheckoutMutation,
  useCreatePortalMutation,
  usePreviewPlanChangeMutation,
  useChangePlanMutation,
  useListInvoicesQuery,
} = billingApi;
