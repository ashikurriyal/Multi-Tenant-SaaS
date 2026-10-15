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

  const run = useCallback(async () => {
    // Clear the local session even if the request fails (e.g. offline)
    await logout()
      .unwrap()
      .catch(() => undefined);
    dispatch(loggedOut());
    dispatch(baseApi.util.resetApiState());
    router.replace("/login");
  }, [dispatch, logout, router]);

  return { logout: run, isLoggingOut: isLoading };
}
