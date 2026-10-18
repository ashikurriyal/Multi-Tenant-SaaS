"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { baseApi } from "@/redux/api/baseApi";
import { useLogoutMutation } from "@/redux/api/authApi";
import { loggedOut } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";

export function useLogout() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logout, { isLoading }] = useLogoutMutation();

  // `to`: where to go afterwards, e.g. /register from the demo banner
  const run = useCallback(
    async (to = "/login") => {
      // Clear the local session even if the request fails (e.g. offline)
      await logout()
        .unwrap()
        .catch(() => undefined);
      dispatch(loggedOut(to));
      dispatch(baseApi.util.resetApiState());
      router.replace(to);
    },
    [dispatch, logout, router],
  );

  return { logout: run, isLoggingOut: isLoading };
}
