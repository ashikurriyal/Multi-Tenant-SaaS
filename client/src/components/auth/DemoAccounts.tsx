"use client";

import { AlertCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiError } from "@/lib/api-error";
import { useDemoLoginMutation, useGetDemoAccountsQuery } from "@/redux/api/authApi";
import { setCredentials } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import type { DemoAccount } from "@/types/api";

/**
 * SRS 21.2: one click into a ready-made organization, no password. Shown only when the
 * API offers demo accounts (DEMO_ENABLED); nothing renders otherwise.
 */
export default function DemoAccounts() {
  const dispatch = useAppDispatch();
  const { data: accounts } = useGetDemoAccountsQuery();
  const [demoLogin] = useDemoLoginMutation();
  const [pending, setPending] = useState<DemoAccount["account"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!accounts?.length) return null;

  const signIn = async (account: DemoAccount["account"]) => {
    setPending(account);
    setError(null);
    try {
      // useRedirectWhenAuthenticated (in LoginForm) takes it from here
      dispatch(setCredentials(await demoLogin(account).unwrap()));
    } catch (err) {
      setError(getApiError(err as Parameters<typeof getApiError>[0])?.message ?? "Try again");
      setPending(null);
    }
  };

  return (
    <section aria-labelledby="demo-heading" className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <h2 id="demo-heading" className="text-xs font-medium text-muted-foreground uppercase">
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
