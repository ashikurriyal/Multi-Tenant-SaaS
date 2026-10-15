import type { LoginValues, RegisterValues } from "@/schemas/auth";
import type { ApiResponse, AuthUser, OrgRole } from "@/types/api";
import { baseApi } from "./baseApi";

type LoginResult = { accessToken: string; user: AuthUser };
type RegisterResult = {
  user: AuthUser;
  organization: { id: string; name: string; slug: string; role: OrgRole };
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResult, LoginValues>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (r: ApiResponse<LoginResult>) => r.data,
    }),
    register: build.mutation<RegisterResult, RegisterValues>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      transformResponse: (r: ApiResponse<RegisterResult>) => r.data,
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useLogoutMutation } = authApi;
