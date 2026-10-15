"use client";

import { notFound, useParams, usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/useHydrated";
import { loginPathWithNext } from "@/lib/redirects";
import { useGetMeQuery } from "@/redux/api/userApi";
import { setActiveOrg } from "@/redux/features/orgSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/**
 * Guard for /[orgSlug]/* (SRS section 17.3): waits for AuthBootstrap, sends guests to
 * /login?next=…, and shows 404 for organizations the user doesn't belong to —
 * the same answer the API gives (ORG_NOT_FOUND).
 */
export default function RequireOrgMember({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const status = useAppSelector((s) => s.auth.status);
  const { data: me } = useGetMeQuery(undefined, { skip: status !== "authenticated" });
  const membership = me?.memberships.find((m) => m.organization.slug === orgSlug);

  useEffect(() => {
    if (status === "unauthenticated") router.replace(loginPathWithNext(pathname));
  }, [status, pathname, router]);

  useEffect(() => {
    if (membership) dispatch(setActiveOrg(membership.organization.id));
  }, [membership, dispatch]);

  // Same skeleton as the server HTML until hydration is done (see useHydrated)
  if (!hydrated || status !== "authenticated" || !me) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 p-8" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (!membership) notFound();

  return <>{children}</>;
}
