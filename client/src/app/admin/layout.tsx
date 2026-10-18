import AdminShell from "@/components/admin/AdminShell";
import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <RequireSuperAdmin>
      <AdminShell>{children}</AdminShell>
    </RequireSuperAdmin>
  );
}
