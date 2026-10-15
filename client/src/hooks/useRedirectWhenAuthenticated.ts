"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { homePathFor, safeNextPath } from "@/lib/redirects";
import { useGetMeQuery } from "@/redux/api/userApi";
import { useAppSelector } from "@/redux/hooks";
import { useHydrated } from "./useHydrated";

/**
 * For guest-only pages (login, register). The single place that leaves them once a
 * session exists — after AuthBootstrap restores one, or right after login/register.
 * Goes to ?next= when it is a safe in-app path, else the user's first organization.
 */
export function useRedirectWhenAuthenticated() {
  const hydrated = useHydrated();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const status = useAppSelector((s) => s.auth.status);
  const { data: me } = useGetMeQuery(undefined, { skip: status !== "authenticated" });

  useEffect(() => {
    if (status === "authenticated" && me) {
      router.replace(safeNextPath(next) ?? homePathFor(me));
    }
  }, [status, me, next, router]);

  // Hide the form while hydrating, while the session is restored, or when we're about to leave
  return {
    checking: !hydrated || status === "idle" || status === "loading" || status === "authenticated",
  };
}
