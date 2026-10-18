"use client";

import { notFound, useParams } from "next/navigation";
import { useEffect } from "react";
import { setActiveOrg } from "@/redux/features/orgSlice";
import { useAppDispatch } from "@/redux/hooks";
import PageSkeleton from "./PageSkeleton";
import SessionLoadError from "./SessionLoadError";
import { useSessionGate } from "./useSessionGate";

/**
 * Guard for /[orgSlug]/* (SRS section 17.3): waits for AuthBootstrap, sends guests to
 * /login?next=…, and shows 404 for organizations the user doesn't belong to —
 * the same answer the API gives (ORG_NOT_FOUND).
 */
export default function RequireOrgMember({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { ready, me, loadFailed, retry } = useSessionGate();
  const membership = me?.memberships.find((m) => m.organization.slug === orgSlug);

  useEffect(() => {
    if (membership) dispatch(setActiveOrg(membership.organization.id));
  }, [membership, dispatch]);

  if (loadFailed) return <SessionLoadError onRetry={retry} />;
  if (!ready) return <PageSkeleton />;
  if (!membership) notFound();

  return <>{children}</>;
}
