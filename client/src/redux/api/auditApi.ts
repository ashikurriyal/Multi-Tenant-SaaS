import type { ApiMeta, ApiResponse, AuditCategory, AuditEntry } from "@/types/api";
import { baseApi } from "./baseApi";

export type AuditLogArgs = { orgId: string; page: number; limit: number; category?: AuditCategory };

export const auditApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAuditLogs: build.query<{ data: AuditEntry[]; meta: ApiMeta }, AuditLogArgs>({
      query: ({ orgId, ...params }) => ({ url: `/orgs/${orgId}/audit-logs`, params }),
      transformResponse: (r: ApiResponse<AuditEntry[]>) => ({ data: r.data, meta: r.meta! }),
      providesTags: (_r, _e, { orgId }) => [{ type: "Audit", id: orgId }],
    }),
  }),
});

export const { useListAuditLogsQuery } = auditApi;
