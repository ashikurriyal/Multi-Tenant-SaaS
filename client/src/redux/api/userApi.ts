import type { ApiResponse, AuthUser, Me } from "@/types/api";
import { baseApi } from "./baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<Me, void>({
      query: () => "/users/me",
      transformResponse: (r: ApiResponse<Me>) => r.data,
      providesTags: ["Me"],
    }),
    // FR-USER-02: the sidebar and user menu read the name from getMe, so it's refreshed
    updateMe: build.mutation<AuthUser, { name: string }>({
      query: (body) => ({ url: "/users/me", method: "PATCH", body }),
      transformResponse: (r: ApiResponse<AuthUser>) => r.data,
      invalidatesTags: ["Me"],
    }),
    // FR-USER-03: signs out every device, including this one (the API clears the cookie)
    changePassword: build.mutation<void, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: "/users/me/password", method: "PATCH", body }),
    }),
  }),
});

export const { useGetMeQuery, useUpdateMeMutation, useChangePasswordMutation } = userApi;
