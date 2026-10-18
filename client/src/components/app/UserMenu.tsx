"use client";

import { ChevronsUpDown, LogOut, Shield } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useLogout } from "@/hooks/useLogout";
import { useGetMeQuery } from "@/redux/api/userApi";

export default function UserMenu() {
  const { data: me } = useGetMeQuery();
  const { logout, isLoggingOut } = useLogout();
  if (!me) return null;
  const initial = me.name[0]?.toUpperCase() ?? "?";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-8 rounded-md">
                <AvatarFallback className="rounded-md">{initial}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{me.name}</span>
                <span className="truncate text-xs text-muted-foreground">{me.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" side="top" align="start">
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
              {me.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {me.platformRole === "SUPER_ADMIN" && (
              <DropdownMenuItem asChild>
                <Link href="/admin">
                  <Shield className="size-4" />
                  Platform admin
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => void logout()} disabled={isLoggingOut}>
              <LogOut className="size-4" />
              {isLoggingOut ? "Logging out…" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
