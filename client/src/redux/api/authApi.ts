import type { LoginValues, RegisterValues } from "@/schemas/auth";
import type { ApiResponse, AuthUser, DemoAccount, OrgRole } from "@/types/api";
import { baseApi } from "./baseApi";

type Session = { accessToken: string; user: AuthUser };
type RegisterResult = {
  user: AuthUser;
  organization: { id: string; name: string; slug: string; role: OrgRole };
} & (
  | { verificationRequired: true }
  // Signed up from an invitation to the same address: already verified and logged in
  | { verificationRequired: false; accessToken: string }
);
type RegisterArgs = RegisterValues & { inviteToken?: string; next?: string };
type MessageResult = { message: string };

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<Session, LoginValues>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (r: ApiResponse<Session>) => r.data,
    }),
    // SRS 21.2: empty unless the API has DEMO_ENABLED and the demo exists right now
    getDemoAccounts: build.query<DemoAccount[], void>({
      query: () => "/demo/accounts",
      transformResponse: (r: ApiResponse<DemoAccount[]>) => r.data,
    }),
    demoLogin: build.mutation<Session, DemoAccount["account"]>({
      query: (account) => ({ url: "/demo/login", method: "POST", body: { account } }),
      transformResponse: (r: ApiResponse<Session>) => r.data,
    }),
    register: build.mutation<RegisterResult, RegisterArgs>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      transformResponse: (r: ApiResponse<RegisterResult>) => r.data,
    }),
    verifyEmail: build.mutation<Session, { token: string }>({
      query: (body) => ({ url: "/auth/verify-email", method: "POST", body }),
      transformResponse: (r: ApiResponse<Session>) => r.data,
    }),
    // Both answer the same for every address, so the UI shows the server's message
    resendVerification: build.mutation<MessageResult, { email: string; next?: string }>({
      query: (body) => ({ url: "/auth/resend-verification", method: "POST", body }),
      transformResponse: (r: ApiResponse<null>) => ({ message: r.message }),
    }),
    forgotPassword: build.mutation<MessageResult, { email: string }>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
      transformResponse: (r: ApiResponse<null>) => ({ message: r.message }),
    }),
    resetPassword: build.mutation<MessageResult, { token: string; password: string }>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
      transformResponse: (r: ApiResponse<null>) => ({ message: r.message }),
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
  useGetDemoAccountsQuery,
  useDemoLoginMutation,
} = authApi;
