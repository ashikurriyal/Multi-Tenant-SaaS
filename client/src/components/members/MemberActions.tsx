"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ConfirmDialog from "@/components/states/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { getApiError } from "@/lib/api-error";
import { canAssignRole } from "@/lib/permissions";
import { homePathFor } from "@/lib/redirects";
import { useChangeMemberRoleMutation, useRemoveMemberMutation } from "@/redux/api/orgApi";
import type { Member, OrgRole } from "@/types/api";
import RoleBadge, { roleLabel } from "./RoleBadge";

const ROLES: OrgRole[] = ["OWNER", "ADMIN", "BILLING", "MEMBER"];
const errorMessage = (err: unknown) =>
  getApiError(err as Parameters<typeof getApiError>[0])?.message ?? "Something went wrong";

export function MemberRoleCell({ member }: { member: Member }) {
  const { org, role: myRole, can } = useActiveOrg();
  const [changeRole, { isLoading }] = useChangeMemberRoleMutation();
  if (!org || !myRole) return null;

  // Only Owners grant or remove Owner (FR-ORG-05); the API checks it again
  const options = ROLES.filter((r) => r === member.role || canAssignRole(myRole, member.role, r));
  if (!can("members:manage") || options.length <= 1) return <RoleBadge role={member.role} />;

  const onChange = async (role: string) => {
    try {
      await changeRole({ orgId: org.id, membershipId: member.id, role: role as OrgRole }).unwrap();
      toast.success(`${member.user.name} is now ${roleLabel(role as OrgRole).toLowerCase()}`);
    } catch (err) {
      // e.g. 409 LAST_OWNER
      toast.error(errorMessage(err));
    }
  };

  return (
    <Select value={member.role} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger size="sm" className="w-32" aria-label={`Role of ${member.user.name}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((r) => (
          <SelectItem key={r} value={r}>
            {roleLabel(r)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function MemberRemoveCell({ member }: { member: Member }) {
  const router = useRouter();
  const { me, org, role: myRole, can } = useActiveOrg();
  const [removeMember, { isLoading }] = useRemoveMemberMutation();
  if (!me || !org || !myRole) return null;

  const isSelf = member.user.id === me.id;
  const canRemove =
    isSelf || (can("members:manage") && (member.role !== "OWNER" || myRole === "OWNER"));
  if (!canRemove) return null;

  const onConfirm = async () => {
    try {
      await removeMember({ orgId: org.id, membershipId: member.id }).unwrap();
      if (isSelf) {
        toast.success(`You left ${org.name}`);
        const remaining = me.memberships.filter((m) => m.organization.id !== org.id);
        router.replace(homePathFor({ memberships: remaining }));
      } else {
        toast.success(`${member.user.name} was removed`);
      }
    } catch (err) {
      // e.g. 409 LAST_OWNER
      toast.error(errorMessage(err));
    }
  };

  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="sm" disabled={isLoading}>
          {isSelf ? "Leave" : "Remove"}
        </Button>
      }
      title={isSelf ? `Leave ${org.name}?` : `Remove ${member.user.name}?`}
      description={
        isSelf
          ? "You'll lose access to this organization until someone invites you again."
          : `${member.user.email} will lose access to ${org.name} immediately.`
      }
      confirmLabel={isSelf ? "Leave organization" : "Remove member"}
      onConfirm={onConfirm}
    />
  );
}
