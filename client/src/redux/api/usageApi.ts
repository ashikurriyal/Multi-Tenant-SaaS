import type { ApiResponse, DailyUsage, UsageSummary } from "@/types/api";
import { baseApi } from "./baseApi";

export type DailyUsageArgs = { orgId: string; from?: string; to?: string; metric?: string };

export const usageApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsageSummary: build.query<UsageSummary, string>({
      query: (orgId) => `/orgs/${orgId}/usage/summary`,
      transformResponse: (r: ApiResponse<UsageSummary>) => r.data,
      providesTags: (_r, _e, orgId) => [{ type: "Usage", id: orgId }],
    }),
    getDailyUsage: build.query<DailyUsage, DailyUsageArgs>({
      query: ({ orgId, ...params }) => ({ url: `/orgs/${orgId}/usage/daily`, params }),
      transformResponse: (r: ApiResponse<DailyUsage>) => r.data,
      providesTags: (_r, _e, { orgId }) => [{ type: "Usage", id: orgId }],
    }),
  }),
});

export const { useGetUsageSummaryQuery, useGetDailyUsageQuery } = usageApi;
