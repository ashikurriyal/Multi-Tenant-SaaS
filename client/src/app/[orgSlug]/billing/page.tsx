"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/app/PageHeader";
import CurrentPlanCard from "@/components/billing/CurrentPlanCard";
import InvoicesTable from "@/components/billing/InvoicesTable";
import ManageBillingButton from "@/components/billing/ManageBillingButton";
import PlanOptions from "@/components/billing/PlanOptions";
import ErrorState from "@/components/states/ErrorState";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { baseApi } from "@/redux/api/baseApi";
import { useGetSubscriptionQuery } from "@/redux/api/billingApi";
import { useAppDispatch } from "@/redux/hooks";
import type { BillingSubscription } from "@/types/api";

type TWaiting = { kind: "checkout" } | { kind: "change"; planCode: string };

const POLL_MS = 2_000;
const GIVE_UP_MS = 30_000;

// What the webhook will have written once Stripe confirms (FR-BILL-03)
const isDone = (s: BillingSubscription, waiting: TWaiting) =>
  waiting.kind === "checkout"
    ? s.isPaidPlan && (s.status === "ACTIVE" || s.status === "TRIALING")
    : s.plan.code === waiting.planCode;

export default function BillingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { org, can } = useActiveOrg();
  const checkoutResult = searchParams.get("checkout");

  // Back from Stripe Checkout: nothing is active until the webhook arrives, so poll
  const [waiting, setWaiting] = useState<TWaiting | null>(() =>
    checkoutResult === "success" ? { kind: "checkout" } : null,
  );
  const [timedOut, setTimedOut] = useState(false);
  const canRead = can("billing:read");
  const canManage = can("billing:manage");

  const {
    data: subscription,
    isLoading,
    isError,
    refetch,
  } = useGetSubscriptionQuery(org?.id ?? "", {
    skip: !org || !canRead,
    pollingInterval: waiting && !timedOut ? POLL_MS : 0,
  });
  const done = Boolean(waiting && subscription && isDone(subscription, waiting));
  const polling = Boolean(waiting) && !done && !timedOut;

  useEffect(() => {
    if (!polling) return;
    const timer = setTimeout(() => setTimedOut(true), GIVE_UP_MS);
    return () => clearTimeout(timer);
  }, [polling]);

  useEffect(() => {
    if (!done || !org) return;
    toast.success(`You're on ${subscription?.plan.name} now`);
    // Seats, limits and the plan badge elsewhere come from the organization and invoices
    dispatch(
      baseApi.util.invalidateTags([
        { type: "Org", id: org.id },
        { type: "Invoices", id: org.id },
      ]),
    );
    if (checkoutResult) router.replace(pathname, { scroll: false });
  }, [done, org, subscription?.plan.name, dispatch, checkoutResult, router, pathname]);

  useEffect(() => {
    if (checkoutResult !== "canceled") return;
    toast.info("Checkout canceled. You weren't charged.");
    router.replace(pathname, { scroll: false });
  }, [checkoutResult, router, pathname]);

  if (!org) return null;
  if (!canRead) {
    return (
      <p className="text-sm text-muted-foreground">
        Only owners, admins and billing members can see billing.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader title="Billing" description="Your plan, payment method and invoices." />

      {polling && (
        <Alert>
          <Loader2 className="animate-spin" />
          <AlertTitle>Confirming with Stripe…</AlertTitle>
          <AlertDescription>
            {waiting?.kind === "checkout"
              ? "Payment received. Activating your plan — this takes a few seconds."
              : "Applying your plan change — this takes a few seconds."}
          </AlertDescription>
        </Alert>
      )}
      {timedOut && !done && (
        <Alert>
          <CheckCircle2 />
          <AlertTitle>Still processing</AlertTitle>
          <AlertDescription>
            Stripe is taking longer than usual. Your plan will update shortly; refresh this page in
            a minute.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : isError || !subscription ? (
        <ErrorState message="Couldn't load your subscription." onRetry={refetch} />
      ) : (
        <>
          <CurrentPlanCard
            subscription={subscription}
            actions={
              canManage && subscription.hasBillingAccount ? (
                <ManageBillingButton orgId={org.id} />
              ) : undefined
            }
          />
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Plans</h2>
            <PlanOptions
              orgId={org.id}
              subscription={subscription}
              canManage={canManage}
              onPlanChangeSubmitted={(planCode) => {
                setTimedOut(false);
                setWaiting({ kind: "change", planCode });
              }}
            />
          </section>
        </>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Invoices</h2>
        <InvoicesTable orgId={org.id} />
      </section>
    </div>
  );
}
