"use client";

import PageHeader from "@/components/app/PageHeader";
import InviteDialog from "@/components/invitations/InviteDialog";
import PendingInvitations from "@/components/invitations/PendingInvitations";
import MembersTable from "@/components/members/MembersTable";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useGetOrganizationQuery } from "@/redux/api/orgApi";

export default function MembersPage() {
  const { org, can } = useActiveOrg();
  const { data: details } = useGetOrganizationQuery(org?.id ?? "", { skip: !org });
  const manage = can("members:manage");
  const seats = details?.entitlements;
  const seatsFull = seats ? seats.seatsUsed >= seats.seatLimit : false;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Members"
        description={
          seats
            ? `${seats.seatsUsed} of ${seats.seatLimit} seats used (members + pending invitations)`
            : "People in this organization"
        }
        actions={manage ? <InviteDialog seatsFull={seatsFull} /> : undefined}
      />
      <MembersTable />
      {manage && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Pending invitations</h2>
          <PendingInvitations />
        </section>
      )}
    </div>
  );
}
