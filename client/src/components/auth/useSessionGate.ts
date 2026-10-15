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
  const { data: me } = useGetMeQuery(undefined, { skip: status !== "authenticated" });

  useEffect(() => {
    if (status === "unauthenticated") router.replace(loginPathWithNext(pathname));
  }, [status, pathname, router]);

  // Same skeleton as the server HTML until hydration is done (see useHydrated)
  const ready = hydrated && status === "authenticated" && Boolean(me);
  return { ready, me };
}
