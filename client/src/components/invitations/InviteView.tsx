"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import AuthChecking from "@/components/auth/AuthChecking";
import RoleBadge from "@/components/members/RoleBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/useHydrated";
import { useLogout } from "@/hooks/useLogout";
import { getApiError } from "@/lib/api-error";
import { homePathFor, orgHomePath } from "@/lib/redirects";
import { useAcceptInvitationMutation, useGetInvitationQuery } from "@/redux/api/invitationApi";
import { useGetMeQuery } from "@/redux/api/userApi";
import { useAppSelector } from "@/redux/hooks";

// FR-INV-04: anyone can open the link; accepting needs the invited account
export default function InviteView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { token } = useParams<{ token: string }>();
  const status = useAppSelector((s) => s.auth.status);
  const invitation = useGetInvitationQuery(token);
  const { data: me } = useGetMeQuery(undefined, { skip: status !== "authenticated" });
  const [accept, { isLoading: accepting }] = useAcceptInvitationMutation();
  const { logout } = useLogout();

  const sessionKnown = status === "authenticated" ? Boolean(me) : status === "unauthenticated";
  if (!hydrated || invitation.isLoading || !sessionKnown) return <AuthChecking />;

  if (invitation.isError || !invitation.data) {
    const error = getApiError(invitation.error);
    return (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          {error?.errorCode === "INVITE_EXPIRED"
            ? "This invitation has expired or was already used. Ask the person who invited you to send a new one."
            : "This invitation link isn't valid. Check that you copied the whole link."}
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href={me ? homePathFor(me) : "/login"}>{me ? "Go to LedgerFlow" : "Log in"}</Link>
        </Button>
      </div>
    );
  }

  const inv = invitation.data;
  const here = `/invite/${token}`;
  const details = (
    <div className="space-y-1 rounded-lg border p-4 text-sm">
      <div className="text-base font-semibold">{inv.organization.name}</div>
      <div className="text-muted-foreground">
        {inv.invitedBy} invited <span className="font-medium text-foreground">{inv.email}</span>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <span className="text-muted-foreground">Role</span>
        <RoleBadge role={inv.role} />
      </div>
    </div>
  );

  if (status === "unauthenticated") {
    return (
      <div className="space-y-4">
        {details}
        <p className="text-sm text-muted-foreground">
          Log in or create an account with <span className="font-medium">{inv.email}</span> to
          accept.
        </p>
        <div className="grid gap-2">
          <Button asChild>
            <Link href={`/login?next=${encodeURIComponent(here)}`}>Log in to accept</Link>
          </Button>
          <Button asChild variant="outline">
            <Link
              href={`/register?next=${encodeURIComponent(here)}&email=${encodeURIComponent(inv.email)}`}
            >
              Create an account
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (me && me.email !== inv.email) {
    return (
      <div className="space-y-4">
        {details}
        <Alert>
          <AlertDescription>
            You&apos;re logged in as <span className="font-medium">{me.email}</span>, but this
            invitation is for <span className="font-medium">{inv.email}</span>. Log out and log in
            with the invited email to accept.
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="w-full" onClick={() => void logout()}>
          Log out
        </Button>
      </div>
    );
  }

  const onAccept = async () => {
    try {
      const { organization } = await accept(token).unwrap();
      toast.success(`You joined ${organization.name}`);
      router.replace(orgHomePath(organization.slug));
    } catch (err) {
      // 402 seats full since the invite was sent, 409 already a member, 410 expired
      toast.error(getApiError(err as Parameters<typeof getApiError>[0])?.message);
    }
  };

  return (
    <div className="space-y-4">
      {details}
      <Button className="w-full" onClick={onAccept} disabled={accepting}>
        {accepting ? "Joining…" : `Join ${inv.organization.name}`}
      </Button>
    </div>
  );
}
