import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import InviteView from "@/components/invitations/InviteView";

export const metadata: Metadata = { title: "Invitation · LedgerFlow" };

export default function InvitePage() {
  return (
    <AuthShell
      title="You're invited"
      description="Join your team on LedgerFlow."
      footer={<span>Invitations are valid for 7 days.</span>}
    >
      <InviteView />
    </AuthShell>
  );
}
