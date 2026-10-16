"use client";

import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getApiError } from "@/lib/api-error";
import { useCreatePortalMutation } from "@/redux/api/billingApi";

// FR-BILL-07: Stripe-hosted page for card, invoices, billing details and cancellation
export default function ManageBillingButton({
  orgId,
  label = "Manage billing",
  variant = "outline",
}: {
  orgId: string;
  label?: string;
  variant?: "outline" | "default";
}) {
  const [createPortal, { isLoading }] = useCreatePortalMutation();

  const onClick = async () => {
    try {
      const { url } = await createPortal(orgId).unwrap();
      window.location.assign(url);
    } catch (err) {
      toast.error(getApiError(err as Parameters<typeof getApiError>[0])?.message);
    }
  };

  return (
    <Button variant={variant} onClick={onClick} disabled={isLoading}>
      {isLoading ? "Opening…" : label}
      <ExternalLink />
    </Button>
  );
}
