import { Badge } from "@/components/ui/badge";
import type { OrgRole } from "@/types/api";

const LABEL: Record<OrgRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  BILLING: "Billing",
  MEMBER: "Member",
};

export const roleLabel = (role: OrgRole) => LABEL[role];

export default function RoleBadge({ role }: { role: OrgRole }) {
  return <Badge variant={role === "OWNER" ? "default" : "secondary"}>{LABEL[role]}</Badge>;
}
