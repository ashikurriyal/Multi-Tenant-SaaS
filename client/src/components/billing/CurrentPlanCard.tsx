import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/format";
import type { BillingSubscription } from "@/types/api";
import StatusBadge from "./StatusBadge";

// What the organization has now (SRS 12.1 UI messages)
export default function CurrentPlanCard({
  subscription: s,
  actions,
}: {
  subscription: BillingSubscription;
  actions?: React.ReactNode;
}) {
  const paid = s.isPaidPlan && s.status !== "CANCELED";
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <CardDescription>Current plan</CardDescription>
          <CardTitle className="flex items-center gap-2 text-2xl">
            {paid ? s.plan.name : "Free"}
            <StatusBadge status={s.status} />
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {paid
              ? `${formatMoney(s.plan.monthlyPriceCents)} / month`
              : "No payment needed. Upgrade any time for more seats and usage."}
          </p>
        </div>
        {actions}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {paid && s.status === "ACTIVE" && !s.cancelAtPeriodEnd && (
          <p className="text-muted-foreground">Renews on {formatDate(s.currentPeriodEnd)}.</p>
        )}
        {paid && s.cancelAtPeriodEnd && (
          <Alert>
            <AlertTriangle />
            <AlertTitle>Cancels on {formatDate(s.currentPeriodEnd)}</AlertTitle>
            <AlertDescription>
              You keep {s.plan.name} until then, and move to Free afterwards. You can resume in
              Manage billing.
            </AlertDescription>
          </Alert>
        )}
        {s.status === "TRIALING" && s.trialEndsAt && (
          <p className="text-muted-foreground">
            Trial ends on {formatDate(s.trialEndsAt)}. Add a card in Manage billing to keep the
            plan.
          </p>
        )}
        {s.status === "PAST_DUE" && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Payment failed</AlertTitle>
            <AlertDescription>
              {s.graceEndsAt
                ? `Full access continues until ${formatDate(s.graceEndsAt)}. Update the payment method to keep ${s.plan.name}.`
                : "Update the payment method to keep your plan."}
            </AlertDescription>
          </Alert>
        )}
        {s.status === "UNPAID" && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Plan paused</AlertTitle>
            <AlertDescription>
              Your plan is paused until payment is made. Free limits apply meanwhile.
            </AlertDescription>
          </Alert>
        )}
        {s.status === "INCOMPLETE" && (
          <Alert>
            <AlertTriangle />
            <AlertTitle>Finish setting up your payment</AlertTitle>
            <AlertDescription>The first payment hasn&apos;t completed yet.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
