"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { loginPathWithNext } from "@/lib/redirects";
import { useGetMeQuery } from "@/redux/api/userApi";
import { useAppSelector } from "@/redux/hooks";

// Shared by the signed-in guards: waits for AuthBootstrap, sends guests to /login?next=…
export function useSessionGate() {
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const status = useAppSelector((s) => s.auth.status);
  const afterLogout = useAppSelector((s) => s.auth.afterLogout);
  const {
    data: me,
    isError,
    refetch,
  } = useGetMeQuery(undefined, { skip: status !== "authenticated" });

  useEffect(() => {
    // A deliberate logout already chose its destination; an ended session comes back here
    if (status === "unauthenticated") router.replace(afterLogout ?? loginPathWithNext(pathname));
  }, [status, afterLogout, pathname, router]);

  // Same skeleton as the server HTML until hydration is done (see useHydrated)
  const ready = hydrated && status === "authenticated" && Boolean(me);
  // Signed in, but the account couldn't be loaded (network, API down): offer a retry
  // instead of waiting forever. (A 401 is handled by the API layer, which signs out.)
  const loadFailed = hydrated && status === "authenticated" && !me && isError;
  return { ready, me, loadFailed, retry: refetch };
}
