import type { ApiResponse, Me } from "@/types/api";
import { baseApi } from "./baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<Me, void>({
      query: () => "/users/me",
      transformResponse: (r: ApiResponse<Me>) => r.data,
      providesTags: ["Me"],
    }),
  }),
});

export const { useGetMeQuery } = userApi;
