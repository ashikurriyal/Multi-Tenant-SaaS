import AppShell from "@/components/app/AppShell";
import RequireOrgMember from "@/components/auth/RequireOrgMember";

export default function OrgLayout({ children }: LayoutProps<"/[orgSlug]">) {
  return (
    <RequireOrgMember>
      <AppShell>{children}</AppShell>
    </RequireOrgMember>
  );
}
