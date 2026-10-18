"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { orgHomePath } from "@/lib/redirects";
import dynamic from "next/dynamic";

// Opened from a dialog only: its form libraries (zod, react-hook-form) load on demand
const CreateOrganizationForm = dynamic(() => import("./CreateOrganizationForm"), {
  ssr: false,
});

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export default function OrgSwitcher() {
  const { me, org, role } = useActiveOrg();
  const [creating, setCreating] = useState(false);
  if (!me || !org) return null;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                <div className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                  {initials(org.name)}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{org.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {role?.toLowerCase()}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="start">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Organizations
              </DropdownMenuLabel>
              {me.memberships.map((m) => (
                <DropdownMenuItem key={m.id} asChild>
                  <Link href={orgHomePath(m.organization.slug)}>
                    <span className="truncate">{m.organization.name}</span>
                    {m.organization.id === org.id && <Check className="ml-auto size-4" />}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setCreating(true)}>
                <Plus className="size-4" />
                Create organization
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
            <DialogDescription>
              You&apos;ll be its owner. It starts on the Free plan.
            </DialogDescription>
          </DialogHeader>
          <CreateOrganizationForm onCreated={() => setCreating(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
