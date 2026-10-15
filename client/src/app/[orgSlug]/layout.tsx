import RequireOrgMember from "@/components/auth/RequireOrgMember";

// The full app shell (sidebar, org switcher) comes with feat/client-organizations
export default function OrgLayout({ children }: LayoutProps<"/[orgSlug]">) {
  return <RequireOrgMember>{children}</RequireOrgMember>;
}
