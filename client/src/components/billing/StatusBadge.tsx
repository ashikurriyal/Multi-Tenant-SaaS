import { Badge } from "@/components/ui/badge";
import type { SubscriptionStatus } from "@/types/api";

const LABEL: Record<SubscriptionStatus, string> = {
  ACTIVE: "Active",
  TRIALING: "Trial",
  PAST_DUE: "Past due",
  UNPAID: "Unpaid",
  INCOMPLETE: "Incomplete",
  CANCELED: "Canceled",
};

export default function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const variant =
    status === "ACTIVE" || status === "TRIALING"
      ? "secondary"
      : status === "CANCELED"
        ? "outline"
        : "destructive";
  return <Badge variant={variant}>{LABEL[status]}</Badge>;
}
