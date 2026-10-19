"use client";

import { AlertCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiError } from "@/lib/api-error";
import { useDemoLoginMutation, useGetDemoAccountsQuery } from "@/redux/api/authApi";
import { setCredentials } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import type { DemoAccount } from "@/types/api";

/**
 * SRS 21.2: one click into a ready-made organization, no password. Shown only when the
 * API offers demo accounts (DEMO_ENABLED); nothing renders otherwise.
 *
 * "panel" is the dark grid inside the auth pages' brand panel (large screens); "inline" is
 * the list under the login form, used where that panel is hidden.
 */
type Props = { variant?: "inline" | "panel"; headingId?: string };

// "Owner · Acme (Pro)" -> "AC"
const orgInitials = (label: string) =>
  (label.split("·")[1] ?? label).trim().slice(0, 2).toUpperCase();
const PANEL_TONES = ["#0E7C66", "#4F6BED", "#E0533F", "#5B676E"];

export default function DemoAccounts({ variant = "inline", headingId = "demo-heading" }: Props) {
  const dispatch = useAppDispatch();
  const { data: accounts, isLoading } = useGetDemoAccountsQuery();
  const [demoLogin] = useDemoLoginMutation();
  const [pending, setPending] = useState<DemoAccount["account"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Same size as the list, so the page doesn't jump when it arrives (CLS)
  if (isLoading && variant === "panel") {
    return (
      <div className="as-demo-grid" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className="as-demo as-demo-skel" />
        ))}
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="space-y-2" aria-hidden>
        <Skeleton className="mx-auto h-4 w-40" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-15.5 w-full" />
        ))}
      </div>
    );
  }
  if (!accounts?.length) return null;

  const signIn = async (account: DemoAccount["account"]) => {
    setPending(account);
    setError(null);
    try {
      // useRedirectWhenAuthenticated (in the login and sign-up forms) takes it from here
      dispatch(setCredentials(await demoLogin(account).unwrap()));
    } catch (err) {
      setError(getApiError(err as Parameters<typeof getApiError>[0])?.message ?? "Try again");
      setPending(null);
    }
  };

  if (variant === "panel") {
    return (
      <section aria-labelledby={headingId} className="as-demos">
        <div className="as-demos-head">
          <h2 id={headingId}>Or jump into a demo account</h2>
          <span>No password · reset nightly</span>
        </div>
        {error && <p className="as-demos-error">{error}</p>}
        <ul className="as-demo-grid">
          {accounts.map((a, i) => (
            <li key={a.account}>
              <button
                type="button"
                className="as-demo"
                onClick={() => signIn(a.account)}
                disabled={pending !== null}
              >
                <span
                  className="as-demo-av"
                  style={{ background: PANEL_TONES[i % PANEL_TONES.length] }}
                >
                  {orgInitials(a.label)}
                </span>
                <span className="as-demo-text">
                  <span className="as-demo-label">{a.label}</span>
                  <span className="as-demo-desc">
                    {pending === a.account ? "Signing in…" : a.description}
                  </span>
                </span>
                <ArrowRight className="as-demo-arrow" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <h2 id={headingId} className="text-xs font-medium text-muted-foreground uppercase">
          Or try a demo account
        </h2>
        <span className="h-px flex-1 bg-border" />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <ul className="space-y-2">
        {accounts.map((a) => (
          <li key={a.account}>
            <button
              type="button"
              onClick={() => signIn(a.account)}
              disabled={pending !== null}
              className="group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{a.label}</span>
                <span className="block text-xs text-muted-foreground">{a.description}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {pending === a.account ? (
                  "Signing in…"
                ) : (
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-center text-xs text-muted-foreground">
        Shared sample data, reset every night. Payments use Stripe test mode.
      </p>
    </section>
  );
}
