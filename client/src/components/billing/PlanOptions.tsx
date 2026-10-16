"use client";

import { toast } from "sonner";
import ErrorState from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiError } from "@/lib/api-error";
import { formatMoney } from "@/lib/format";
import { useCreateCheckoutMutation, useGetPlansQuery } from "@/redux/api/billingApi";
import type { BillingSubscription, Plan } from "@/types/api";
import ChangePlanDialog from "./ChangePlanDialog";
import PlanFeatures from "./PlanFeatures";

type Props = {
  orgId: string;
  subscription: BillingSubscription;
  canManage: boolean;
  onPlanChangeSubmitted: (planCode: string) => void;
};

// Statuses in which a paid subscription exists and can be switched (FR-BILL-04)
const SWITCHABLE = ["ACTIVE", "TRIALING"];

export default function PlanOptions({
  orgId,
  subscription: s,
  canManage,
  onPlanChangeSubmitted,
}: Props) {
  const { data: plans, isLoading, isError, refetch } = useGetPlansQuery();
  const [createCheckout, { isLoading: redirecting, originalArgs }] = useCreateCheckoutMutation();
  const holdsPaidPlan = s.isPaidPlan && s.status !== "CANCELED";
  const currentCode = holdsPaidPlan ? s.plan.code : "FREE";

  const upgrade = async (plan: Plan) => {
    try {
      const { url } = await createCheckout({
        orgId,
        planCode: plan.code as "PRO" | "BUSINESS",
      }).unwrap();
      window.location.assign(url); // Stripe's hosted payment page
    } catch (err) {
      toast.error(getApiError(err as Parameters<typeof getApiError>[0])?.message);
    }
  };

  const action = (plan: Plan) => {
    if (plan.code === currentCode) {
      return (
        <Button variant="secondary" className="w-full" disabled>
          Current plan
        </Button>
      );
    }
    if (!canManage) return null;
    if (plan.code === "FREE") {
      return (
        <p className="text-center text-xs text-muted-foreground">
          To move to Free, cancel in Manage billing. You keep your plan until the period ends.
        </p>
      );
    }
    if (!holdsPaidPlan) {
      const busy = redirecting && originalArgs?.planCode === plan.code;
      return (
        <Button className="w-full" onClick={() => upgrade(plan)} disabled={redirecting}>
          {busy ? "Opening checkout…" : `Upgrade to ${plan.name}`}
        </Button>
      );
    }
    if (!SWITCHABLE.includes(s.status)) {
      return (
        <p className="text-center text-xs text-muted-foreground">
          Fix the payment in Manage billing before changing plans.
        </p>
      );
    }
    return (
      <ChangePlanDialog
        orgId={orgId}
        target={plan}
        periodEnd={s.currentPeriodEnd}
        onSubmitted={onPlanChangeSubmitted}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }
  if (isError || !plans) return <ErrorState message="Couldn't load plans." onRetry={refetch} />;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((plan) => (
        <Card key={plan.code} className={plan.code === currentCode ? "border-primary" : undefined}>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>
              <span className="text-2xl font-semibold text-foreground">
                {formatMoney(plan.monthlyPriceCents)}
              </span>{" "}
              / month
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <PlanFeatures plan={plan} />
          </CardContent>
          <CardFooter>{action(plan)}</CardFooter>
        </Card>
      ))}
    </div>
  );
}
