import type {
  ApiResponse,
  InvitableRole,
  OrgRole,
  PendingInvitation,
  PublicInvitation,
} from "@/types/api";
import { baseApi } from "./baseApi";

type CreatedInvitation = { id: string; email: string; role: InvitableRole; expiresAt: string };
type AcceptResult = { organization: { id: string; name: string; slug: string; role: OrgRole } };

export const invitationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listInvitations: build.query<PendingInvitation[], string>({
      query: (orgId) => `/orgs/${orgId}/invitations`,
      transformResponse: (r: ApiResponse<PendingInvitation[]>) => r.data,
      providesTags: (_r, _e, orgId) => [{ type: "Invitations", id: orgId }],
    }),
    createInvitation: build.mutation<
      CreatedInvitation,
      { orgId: string; email: string; role: InvitableRole }
    >({
      query: ({ orgId, ...body }) => ({ url: `/orgs/${orgId}/invitations`, method: "POST", body }),
      transformResponse: (r: ApiResponse<CreatedInvitation>) => r.data,
      invalidatesTags: (_r, _e, { orgId }) => [
        { type: "Invitations", id: orgId },
        { type: "Org", id: orgId }, // pending invitations hold seats
      ],
    }),
    revokeInvitation: build.mutation<void, { orgId: string; invitationId: string }>({
      query: ({ orgId, invitationId }) => ({
        url: `/orgs/${orgId}/invitations/${invitationId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { orgId }) => [
        { type: "Invitations", id: orgId },
        { type: "Org", id: orgId },
      ],
    }),

    // Public: the /invite/<token> page, before login
    getInvitation: build.query<PublicInvitation, string>({
      query: (token) => `/invitations/${token}`,
      transformResponse: (r: ApiResponse<PublicInvitation>) => r.data,
    }),
    acceptInvitation: build.mutation<AcceptResult, string>({
      query: (token) => ({ url: `/invitations/${token}/accept`, method: "POST" }),
      transformResponse: (r: ApiResponse<AcceptResult>) => r.data,
      invalidatesTags: ["Me"],
    }),
  }),
});

export const {
  useListInvitationsQuery,
  useCreateInvitationMutation,
  useRevokeInvitationMutation,
  useGetInvitationQuery,
  useAcceptInvitationMutation,
} = invitationApi;
