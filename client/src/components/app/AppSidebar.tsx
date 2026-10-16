"use client";

import { CreditCard, LayoutDashboard, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import type { Permission } from "@/lib/permissions";
import OrgSwitcher from "./OrgSwitcher";
import UserMenu from "./UserMenu";

type NavItem = { title: string; path: string; icon: typeof Users; permission: Permission };

// Usage, API keys and audit log are added with their phases
const MAIN: NavItem[] = [
  { title: "Dashboard", path: "dashboard", icon: LayoutDashboard, permission: "usage:read" },
  { title: "Billing", path: "billing", icon: CreditCard, permission: "billing:read" },
];
const SETTINGS: NavItem[] = [
  { title: "Members", path: "settings/members", icon: Users, permission: "members:read" },
  { title: "General", path: "settings/general", icon: Settings, permission: "org:update" },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { org, can } = useActiveOrg();
  if (!org) return null;

  const renderItems = (items: NavItem[]) =>
    items
      .filter((item) => can(item.permission))
      .map((item) => {
        const href = `/${org.slug}/${item.path}`;
        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton asChild isActive={pathname === href} tooltip={item.title}>
              <Link href={href}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(MAIN)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(SETTINGS)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
