"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/useLogout";
import { useGetMeQuery } from "@/redux/api/userApi";

// Placeholder until the dashboard is built (Phase 3); proves the protected route works
export default function DashboardPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { data: me } = useGetMeQuery();
  const { logout, isLoggingOut } = useLogout();
  const membership = me?.memberships.find((m) => m.organization.slug === orgSlug);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{membership?.organization.name}</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {me?.name} ({me?.email}) · {membership?.role.toLowerCase()}
          </p>
        </div>
        <Button variant="outline" onClick={logout} disabled={isLoggingOut}>
          {isLoggingOut ? "Logging out…" : "Log out"}
        </Button>
      </div>
      <p className="text-muted-foreground">The dashboard arrives in a later phase.</p>
    </main>
  );
}
