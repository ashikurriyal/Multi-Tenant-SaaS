import type { ApiMeta, ApiResponse, Member, OrganizationDetails, OrgRole } from "@/types/api";
import { baseApi } from "./baseApi";

type OrgSummary = { id: string; name: string; slug: string; role: OrgRole };

export const orgApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getOrganization: build.query<OrganizationDetails, string>({
      query: (orgId) => `/orgs/${orgId}`,
      transformResponse: (r: ApiResponse<OrganizationDetails>) => r.data,
      providesTags: (_r, _e, orgId) => [{ type: "Org", id: orgId }],
    }),
    createOrganization: build.mutation<OrgSummary, { name: string }>({
      query: (body) => ({ url: "/orgs", method: "POST", body }),
      transformResponse: (r: ApiResponse<OrgSummary>) => r.data,
      invalidatesTags: ["Me"],
    }),
    updateOrganization: build.mutation<OrgSummary, { orgId: string; name: string }>({
      query: ({ orgId, name }) => ({ url: `/orgs/${orgId}`, method: "PATCH", body: { name } }),
      transformResponse: (r: ApiResponse<OrgSummary>) => r.data,
      // The sidebar's org names come from /users/me
      invalidatesTags: (_r, _e, { orgId }) => [{ type: "Org", id: orgId }, "Me"],
    }),

    listMembers: build.query<
      { data: Member[]; meta: ApiMeta },
      { orgId: string; page: number; limit: number }
    >({
      query: ({ orgId, page, limit }) => ({
        url: `/orgs/${orgId}/members`,
        params: { page, limit },
      }),
      transformResponse: (r: ApiResponse<Member[]>) => ({ data: r.data, meta: r.meta! }),
      providesTags: (_r, _e, { orgId }) => [{ type: "Members", id: orgId }],
    }),
    changeMemberRole: build.mutation<
      Member,
      { orgId: string; membershipId: string; role: OrgRole }
    >({
      query: ({ orgId, membershipId, role }) => ({
        url: `/orgs/${orgId}/members/${membershipId}`,
        method: "PATCH",
        body: { role },
      }),
      transformResponse: (r: ApiResponse<Member>) => r.data,
      // Changing your own role changes what you may do, which comes from /users/me
      invalidatesTags: (_r, _e, { orgId }) => [{ type: "Members", id: orgId }, "Me"],
    }),
    removeMember: build.mutation<void, { orgId: string; membershipId: string }>({
      query: ({ orgId, membershipId }) => ({
        url: `/orgs/${orgId}/members/${membershipId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { orgId }) => [
        { type: "Members", id: orgId },
        { type: "Org", id: orgId }, // seats used
        "Me",
      ],
    }),
  }),
});

export const {
  useGetOrganizationQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useListMembersQuery,
  useChangeMemberRoleMutation,
  useRemoveMemberMutation,
} = orgApi;
