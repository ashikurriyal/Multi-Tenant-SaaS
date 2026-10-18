import type {
  AdminTenant,
  AdminWebhookEvent,
  ApiMeta,
  ApiResponse,
  ChurnMonth,
  MrrMonth,
  SubscriptionStatus,
  WebhookEventStatus,
} from "@/types/api";
import { baseApi } from "./baseApi";

export type TenantsArgs = {
  page: number;
  limit: number;
  search?: string;
  plan?: string;
  status?: SubscriptionStatus;
};
export type WebhookEventsArgs = { page: number; limit: number; status: WebhookEventStatus };
type Paged<T> = { data: T[]; meta: ApiMeta };

// Platform-wide reads for super admins (the API answers 403 to everyone else)
export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMrrMetrics: build.query<MrrMonth[], number>({
      query: (months) => ({ url: "/admin/metrics/mrr", params: { months } }),
      transformResponse: (r: ApiResponse<MrrMonth[]>) => r.data,
      providesTags: ["Admin"],
    }),
    getChurnMetrics: build.query<ChurnMonth[], number>({
      query: (months) => ({ url: "/admin/metrics/churn", params: { months } }),
      transformResponse: (r: ApiResponse<ChurnMonth[]>) => r.data,
      providesTags: ["Admin"],
    }),
    listTenants: build.query<Paged<AdminTenant>, TenantsArgs>({
      query: (params) => ({ url: "/admin/tenants", params }),
      transformResponse: (r: ApiResponse<AdminTenant[]>) => ({ data: r.data, meta: r.meta! }),
      providesTags: ["Admin"],
    }),
    listWebhookEvents: build.query<Paged<AdminWebhookEvent>, WebhookEventsArgs>({
      query: (params) => ({ url: "/admin/webhook-events", params }),
      transformResponse: (r: ApiResponse<AdminWebhookEvent[]>) => ({ data: r.data, meta: r.meta! }),
      providesTags: ["Admin"],
    }),
  }),
});

export const {
  useGetMrrMetricsQuery,
  useGetChurnMetricsQuery,
  useListTenantsQuery,
  useListWebhookEventsQuery,
} = adminApi;
