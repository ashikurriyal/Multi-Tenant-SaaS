"use client";

import { ArrowLeft, Building2, LineChart, Shield, Webhook } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "@/components/app/UserMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { homePathFor } from "@/lib/redirects";
import { useGetMeQuery } from "@/redux/api/userApi";

const ITEMS = [
  { title: "Revenue", href: "/admin", icon: LineChart },
  { title: "Organizations", href: "/admin/tenants", icon: Building2 },
  { title: "Webhooks", href: "/admin/webhooks", icon: Webhook },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: me } = useGetMeQuery();
  const appHome = me ? homePathFor(me) : null;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Shield className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">LedgerFlow</span>
                  <span className="truncate text-xs text-muted-foreground">Platform admin</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* Back to the user's own organization, if they belong to one */}
              {appHome && appHome !== "/admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Back to app">
                    <Link href={appHome}>
                      <ArrowLeft />
                      <span>Back to app</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
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
