"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useGetOrganizationQuery } from "@/redux/api/orgApi";

const MESSAGES: Record<string, { title: string; body: string }> = {
  PAST_DUE: {
    title: "Payment failed",
    body: "Update the payment method to keep your plan. Full access continues for a few days.",
  },
  UNPAID: {
    title: "Plan paused",
    body: "Your plan is paused until payment is made. Free limits apply meanwhile.",
  },
  INCOMPLETE: {
    title: "Finish setting up your payment",
    body: "The first payment for your plan hasn't completed yet.",
  },
};

// Shown on every page of the organization (SRS 17.1 "past-due banner"). Uses the org
// details every member can read, so everyone sees it; only billing managers get the button
export default function BillingStatusBanner() {
  const { org, can } = useActiveOrg();
  const { data } = useGetOrganizationQuery(org?.id ?? "", { skip: !org });
  const message = data ? MESSAGES[data.entitlements.status] : undefined;
  if (!org || !message) return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle />
      <AlertTitle>{message.title}</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>
          {message.body}
          {!can("billing:manage") && " Ask an owner or billing member to fix it."}
        </span>
        {can("billing:manage") && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/${org.slug}/billing`}>Go to billing</Link>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
