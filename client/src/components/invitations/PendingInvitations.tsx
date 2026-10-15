"use client";

import { toast } from "sonner";
import RoleBadge from "@/components/members/RoleBadge";
import ConfirmDialog from "@/components/states/ConfirmDialog";
import ErrorState from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { getApiError } from "@/lib/api-error";
import { useListInvitationsQuery, useRevokeInvitationMutation } from "@/redux/api/invitationApi";

const expires = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

// FR-INV-06 — only rendered for members:manage
export default function PendingInvitations() {
  const { org } = useActiveOrg();
  const { data, isLoading, isError, refetch } = useListInvitationsQuery(org?.id ?? "", {
    skip: !org,
  });
  const [revoke] = useRevokeInvitationMutation();

  if (isLoading) return <Skeleton className="h-16 w-full" />;
  if (isError || !data) {
    return <ErrorState message="Couldn't load invitations." onRetry={refetch} />;
  }
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending invitations.</p>;
  }

  const onRevoke = async (invitationId: string, email: string) => {
    if (!org) return;
    try {
      await revoke({ orgId: org.id, invitationId }).unwrap();
      toast.success(`Invitation for ${email} revoked`);
    } catch (err) {
      toast.error(getApiError(err as Parameters<typeof getApiError>[0])?.message);
    }
  };

  return (
    <ul className="divide-y rounded-lg border">
      {data.map((inv) => (
        <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <div className="truncate font-medium">{inv.email}</div>
            <div className="text-sm text-muted-foreground">
              Invited by {inv.invitedBy.name} · expires {expires.format(new Date(inv.expiresAt))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RoleBadge role={inv.role} />
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm">
                  Revoke
                </Button>
              }
              title="Revoke invitation?"
              description={`The link sent to ${inv.email} will stop working.`}
              confirmLabel="Revoke"
              onConfirm={() => onRevoke(inv.id, inv.email)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
