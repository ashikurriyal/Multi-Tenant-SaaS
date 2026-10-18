"use client";

import { notFound } from "next/navigation";
import PageSkeleton from "./PageSkeleton";
import SessionLoadError from "./SessionLoadError";
import { useSessionGate } from "./useSessionGate";

/**
 * Guard for /admin/* (SRS 17.3): guests go to /login?next=…, signed-in users who aren't
 * super admins get 404, so the admin area isn't advertised. The API enforces it as well.
 */
export default function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { ready, me, loadFailed, retry } = useSessionGate();
  if (loadFailed) return <SessionLoadError onRetry={retry} />;
  if (!ready) return <PageSkeleton />;
  if (me?.platformRole !== "SUPER_ADMIN") notFound();
  return <>{children}</>;
}
