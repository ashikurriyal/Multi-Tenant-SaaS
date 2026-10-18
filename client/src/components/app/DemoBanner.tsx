"use client";

import { FlaskConical } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useLogout } from "@/hooks/useLogout";

// Every page of a demo organization says so (SRS 21.2), with a way out to a real account
export default function DemoBanner() {
  const { isDemo, org, me } = useActiveOrg();
  const { logout, isLoggingOut } = useLogout();
  if (!isDemo || !org) return null;

  return (
    <Alert className="mb-6 border-dashed">
      <FlaskConical />
      <AlertTitle>
        Demo: you&apos;re {me?.name ?? "a demo user"} in {org.name}
      </AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>
          Shared sample data, reset every night. Inviting, member changes and renaming are turned
          off; payments use Stripe test mode (card 4242 4242 4242 4242).
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={isLoggingOut}
          onClick={() => void logout("/register")}
        >
          Create your own account
        </Button>
      </AlertDescription>
    </Alert>
  );
}
