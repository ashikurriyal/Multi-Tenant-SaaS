import type { Me } from "@/types/api";

// Only same-site paths: "/acme/billing" yes; "//evil.com", "https://…", "/\evil" no
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return null;
  }
  return next;
}

export const orgHomePath = (slug: string) => `/${slug}/dashboard`;

export const ADMIN_HOME = "/admin";

// Where a logged-in user lands when there is no ?next=. A super admin without an
// organization (e.g. the seeded one) goes to the platform admin instead of onboarding.
export function homePathFor(
  me: Pick<Me, "memberships"> & Partial<Pick<Me, "platformRole">>,
): string {
  const first = me.memberships[0];
  if (first) return orgHomePath(first.organization.slug);
  return me.platformRole === "SUPER_ADMIN" ? ADMIN_HOME : "/onboarding";
}

export const loginPathWithNext = (pathname: string) =>
  `/login?next=${encodeURIComponent(pathname)}`;

// "/invite/<token>" → "<token>": registering from an invitation sends it to the API,
// which then skips the verification email for the invited address
export function inviteTokenFromNext(next: string | null | undefined): string | undefined {
  const path = safeNextPath(next);
  const match = path?.match(/^\/invite\/([A-Za-z0-9_-]{20,100})$/);
  return match?.[1];
}
