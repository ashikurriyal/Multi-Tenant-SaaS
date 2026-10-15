import type { Me } from "@/types/api";

// Only same-site paths: "/acme/billing" yes; "//evil.com", "https://…", "/\evil" no
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return null;
  }
  return next;
}

export const orgHomePath = (slug: string) => `/${slug}/dashboard`;

// Where a logged-in user lands when there is no ?next=
export function homePathFor(me: Pick<Me, "memberships">): string {
  const first = me.memberships[0];
  return first ? orgHomePath(first.organization.slug) : "/onboarding";
}

export const loginPathWithNext = (pathname: string) =>
  `/login?next=${encodeURIComponent(pathname)}`;
