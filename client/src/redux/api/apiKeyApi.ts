import type { ApiKey, ApiResponse, CreatedApiKey } from "@/types/api";
import { baseApi } from "./baseApi";

export const apiKeyApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listApiKeys: build.query<ApiKey[], string>({
      query: (orgId) => `/orgs/${orgId}/api-keys`,
      transformResponse: (r: ApiResponse<ApiKey[]>) => r.data,
      providesTags: (_r, _e, orgId) => [{ type: "ApiKeys", id: orgId }],
    }),
    createApiKey: build.mutation<CreatedApiKey, { orgId: string; name: string }>({
      query: ({ orgId, name }) => ({
        url: `/orgs/${orgId}/api-keys`,
        method: "POST",
        body: { name },
      }),
      transformResponse: (r: ApiResponse<CreatedApiKey>) => r.data,
      invalidatesTags: (_r, _e, { orgId }) => [{ type: "ApiKeys", id: orgId }],
    }),
    revokeApiKey: build.mutation<void, { orgId: string; keyId: string }>({
      query: ({ orgId, keyId }) => ({ url: `/orgs/${orgId}/api-keys/${keyId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { orgId }) => [{ type: "ApiKeys", id: orgId }],
    }),
  }),
});

export const { useListApiKeysQuery, useCreateApiKeyMutation, useRevokeApiKeyMutation } = apiKeyApi;
