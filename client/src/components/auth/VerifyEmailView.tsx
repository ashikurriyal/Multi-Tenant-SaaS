"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import FormField from "@/components/forms/FormField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/useHydrated";
import { useRedirectWhenAuthenticated } from "@/hooks/useRedirectWhenAuthenticated";
import { getApiError } from "@/lib/api-error";
import { safeNextPath } from "@/lib/redirects";
import { authApi } from "@/redux/api/authApi";
import { setCredentials } from "@/redux/features/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import type { AppDispatch } from "@/redux/store";
import ResendVerificationButton from "./ResendVerificationButton";

// One request per token, even if React runs the effect twice (StrictMode) or the
// page re-renders: a verification link can only be used once
const attempts = new Map<string, Promise<string | null>>();

function verifyOnce(dispatch: AppDispatch, token: string) {
  if (!attempts.has(token)) {
    const run = dispatch(authApi.endpoints.verifyEmail.initiate({ token }))
      .unwrap()
      .then((session) => {
        dispatch(setCredentials(session));
        return null;
      })
      .catch((err) => getApiError(err)?.message ?? "Something went wrong");
    attempts.set(token, run);
  }
  return attempts.get(token)!;
}

// FR-AUTH-13: the emailed link verifies the address and logs the user in
export default function VerifyEmailView() {
  const dispatch = useAppDispatch();
  const hydrated = useHydrated();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const next = safeNextPath(searchParams.get("next")) ?? undefined;
  const status = useAppSelector((s) => s.auth.status);
  // Leaves for ?next= or the first organization as soon as the session exists
  useRedirectWhenAuthenticated();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  // Wait until AuthBootstrap has finished: its session check started before the cookie
  // from this verification existed, and finishing later it would log the user out again
  const sessionChecked = status === "unauthenticated" || status === "authenticated";

  useEffect(() => {
    if (!token || !sessionChecked) return;
    let active = true;
    void verifyOnce(dispatch, token).then((message) => {
      if (active && message) setError(message);
    });
    return () => {
      active = false;
    };
  }, [token, sessionChecked, dispatch]);

  if (!hydrated || (token && !error)) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        Verifying your email…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>
          {error ?? "This verification link is incomplete. Open the link from your email again."}
        </AlertDescription>
      </Alert>
      <p className="text-sm text-muted-foreground">
        Already verified? Just log in. Otherwise enter your email to get a new link.
      </p>
      <FormField
        id="resend-email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value.trim())}
      />
      <ResendVerificationButton email={email} next={next} />
      <Button asChild variant="ghost" className="w-full">
        <Link href="/login">Go to log in</Link>
      </Button>
    </div>
  );
}
