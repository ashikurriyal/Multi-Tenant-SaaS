"use client";

import { useParams } from "next/navigation";
import { can, type Permission } from "@/lib/permissions";
import { useGetMeQuery } from "@/redux/api/userApi";

/**
 * The organization in the URL (/[orgSlug]/…) and the caller's role in it, from /users/me.
 * Inside /[orgSlug] pages RequireOrgMember has already checked membership, so `org` is set.
 */
export function useActiveOrg() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { data: me } = useGetMeQuery();
  const membership = me?.memberships.find((m) => m.organization.slug === orgSlug);

  return {
    me,
    org: membership?.organization ?? null,
    membershipId: membership?.id ?? null,
    role: membership?.role ?? null,
    can: (permission: Permission) => can(membership?.role, permission),
  };
}
