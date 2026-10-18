"use client";

import { useParams } from "next/navigation";
import { can, type Permission } from "@/lib/permissions";
import { useGetOrganizationQuery } from "@/redux/api/orgApi";
import { useGetMeQuery } from "@/redux/api/userApi";

/**
 * The organization in the URL (/[orgSlug]/…) and the caller's role in it, from /users/me.
 * Inside /[orgSlug] pages RequireOrgMember has already checked membership, so `org` is set.
 */
export function useActiveOrg() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { data: me } = useGetMeQuery();
  const membership = me?.memberships.find((m) => m.organization.slug === orgSlug);
  // Shared with the pages that show org details (same cached query)
  const {
    data: details,
    isSuccess,
    isError,
  } = useGetOrganizationQuery(membership?.organization.id ?? "", {
    skip: !membership,
  });

  return {
    me,
    org: membership?.organization ?? null,
    membershipId: membership?.id ?? null,
    role: membership?.role ?? null,
    can: (permission: Permission) => can(membership?.role, permission),
    // A shared demo organization (SRS 21.2): invitations, member changes and renaming are off
    isDemo: details?.isDemo ?? false,
    // The org details request has finished (either way): banners that depend on it are known
    detailsSettled: isSuccess || isError,
  };
}
