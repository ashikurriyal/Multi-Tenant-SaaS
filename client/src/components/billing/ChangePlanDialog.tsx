"use client";

import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiError } from "@/lib/api-error";
import { formatDate, formatMoney } from "@/lib/format";
import { useChangePlanMutation, usePreviewPlanChangeMutation } from "@/redux/api/billingApi";
import type { Plan, PlanChangePreview } from "@/types/api";

type Props = {
  orgId: string;
  target: Plan;
  periodEnd: string;
  onSubmitted: (planCode: string) => void;
};

/**
 * FR-BILL-04/05: shows the prorated cost first, then applies it. The idempotency key is
 * made once per opened dialog, so clicking "Confirm" twice can't change the plan twice.
 */
export default function ChangePlanDialog({ orgId, target, periodEnd, onSubmitted }: Props) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<PlanChangePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [loadPreview, { isLoading: previewing }] = usePreviewPlanChangeMutation();
  const [changePlan, { isLoading: changing }] = useChangePlanMutation();
  const planCode = target.code as "PRO" | "BUSINESS";

  const onOpenChange = async (next: boolean) => {
    setOpen(next);
    if (!next) return;
    setPreview(null);
    setError(null);
    setIdempotencyKey(crypto.randomUUID());
    try {
      setPreview(await loadPreview({ orgId, planCode }).unwrap());
    } catch (err) {
      // e.g. 409 SEATS_EXCEED_TARGET_PLAN, PAYMENT_FAILED (past due)
      setError(
        getApiError(err as Parameters<typeof getApiError>[0])?.message ??
          "Couldn't load the price.",
      );
    }
  };

  const onConfirm = async () => {
    if (!preview) return;
    try {
      await changePlan({
        orgId,
        planCode,
        prorationDate: preview.prorationDate,
        idempotencyKey,
      }).unwrap();
      toast.success(`Switching to ${target.name}…`);
      setOpen(false);
      onSubmitted(target.code);
    } catch (err) {
      // e.g. 402 card declined — nothing was changed
      setError(
        getApiError(err as Parameters<typeof getApiError>[0])?.message ?? "Something went wrong",
      );
    }
  };

  const credit = preview && preview.amountDueNowCents < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Switch to {target.name}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Switch to {target.name}</DialogTitle>
          <DialogDescription>The change applies immediately.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {previewing && (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        )}
        {preview && (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                {credit ? "Credit for the rest of this period" : "Due now (prorated)"}
              </dt>
              <dd className="font-medium">
                {formatMoney(Math.abs(preview.amountDueNowCents), preview.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">From {formatDate(periodEnd)}</dt>
              <dd className="font-medium">
                {formatMoney(preview.nextMonthlyCents, preview.currency)} / month + overage
              </dd>
            </div>
            {credit && (
              <p className="text-xs text-muted-foreground">
                The credit is applied automatically to your next invoices.
              </p>
            )}
          </dl>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!preview || changing}>
            {changing
              ? "Switching…"
              : credit || preview?.amountDueNowCents === 0
                ? "Confirm switch"
                : preview
                  ? `Pay ${formatMoney(preview.amountDueNowCents, preview.currency)} and switch`
                  : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
