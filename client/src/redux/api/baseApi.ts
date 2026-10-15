import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { loggedOut, setAccessToken } from "../features/authSlice";
import type { RootState } from "../store";
import { refreshAccessToken } from "./session";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api/v1", // through the Next.js rewrite, so cookies stay first-party
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

// SRS section 16.7: on 401, refresh once and retry the request once
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const tokenUsed = (api.getState() as RootState).auth.accessToken;
  let result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === "string" ? args : args.url;

  if (result.error?.status === 401 && !url.startsWith("/auth/")) {
    const current = (api.getState() as RootState).auth.accessToken;

    // Another request already refreshed while this one was in flight: just retry
    if (current && current !== tokenUsed) {
      return rawBaseQuery(args, api, extraOptions);
    }

    const token = await refreshAccessToken();
    if (token) {
      api.dispatch(setAccessToken(token));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(loggedOut());
      api.dispatch(baseApi.util.resetApiState());
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Me",
    "Org",
    "Members",
    "Invitations",
    "Subscription",
    "Invoices",
    "ApiKeys",
    "Usage",
    "Audit",
    "Admin",
  ],
  endpoints: () => ({}),
});
