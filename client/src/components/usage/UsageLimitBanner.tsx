"use client";

import { AlertTriangle, Gauge, X } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { formatDate, formatMoney, formatUnits } from "@/lib/format";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { dismissBanner } from "@/redux/features/uiSlice";
import type { UsageSummary } from "@/types/api";

const WARN_AT = 80; // SRS 17.1: banners at 80% and 100% of the included units

/**
 * Free plans stop at the limit (new usage gets 429); paid plans continue into overage.
 * The 80% notice can be dismissed for the rest of the period; the limit notice can't.
 */
export default function UsageLimitBanner({ summary }: { summary: UsageSummary }) {
  const { org, can } = useActiveOrg();
  const dispatch = useAppDispatch();
  const dismissed = useAppSelector((s) => s.ui.dismissedBanners);
  if (!org || summary.percentUsed < WARN_AT) return null;

  const over = summary.percentUsed >= 100;
  const bannerId = `usage-${org.id}-${summary.periodStart}-${over ? 100 : WARN_AT}`;
  if (!over && dismissed.includes(bannerId)) return null;

  const resets = formatDate(summary.periodEnd);
  let title: string;
  let body: string;
  if (summary.overageAllowed) {
    title = over ? "You're using more than your plan includes" : "Approaching your included usage";
    body = over
      ? `${formatUnits(summary.unitsUsed - summary.includedUnits)} units over so far (${formatMoney(summary.overageCents)}), billed with your next invoice.`
      : `${summary.percentUsed}% of ${formatUnits(summary.includedUnits)} included units used. Usage beyond that is billed as overage.`;
  } else {
    title = over ? "Monthly usage limit reached" : "Approaching your monthly usage limit";
    body = over
      ? `New usage is rejected until the limit resets on ${resets}.`
      : `${summary.percentUsed}% of ${formatUnits(summary.includedUnits)} units used. At the limit, new usage is rejected until ${resets}.`;
  }
  const upgrade = !summary.overageAllowed && can("billing:manage");
  const blocking = over && !summary.overageAllowed;

  return (
    <Alert variant={blocking ? "destructive" : "default"} className="relative pr-10">
      {blocking ? <AlertTriangle /> : <Gauge />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>
          {body}
          {!summary.overageAllowed &&
            !can("billing:manage") &&
            " Ask an owner or billing member to upgrade."}
        </span>
        {upgrade && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/${org.slug}/billing`}>Upgrade plan</Link>
          </Button>
        )}
      </AlertDescription>
      {!over && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 size-7"
          aria-label="Dismiss"
          onClick={() => dispatch(dismissBanner(bannerId))}
        >
          <X />
        </Button>
      )}
    </Alert>
  );
}
