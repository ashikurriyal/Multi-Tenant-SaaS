"use client";

import PageSkeleton from "./PageSkeleton";
import { useSessionGate } from "./useSessionGate";

// Guard for signed-in pages outside an organization (e.g. /onboarding)
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready } = useSessionGate();
  if (!ready) return <PageSkeleton />;
  return <>{children}</>;
}
