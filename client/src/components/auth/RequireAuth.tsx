"use client";

import PageSkeleton from "./PageSkeleton";
import SessionLoadError from "./SessionLoadError";
import { useSessionGate } from "./useSessionGate";

// Guard for signed-in pages outside an organization (e.g. /onboarding)
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready, loadFailed, retry } = useSessionGate();
  if (loadFailed) return <SessionLoadError onRetry={retry} />;
  if (!ready) return <PageSkeleton />;
  return <>{children}</>;
}
