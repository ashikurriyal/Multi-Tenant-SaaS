"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import BillingStatusBanner from "@/components/billing/BillingStatusBanner";
import DemoBanner from "./DemoBanner";
import AppSidebar from "./AppSidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { org } = useActiveOrg();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <span className="truncate text-sm font-medium">{org?.name}</span>
        </header>
        <div className="flex-1 p-4 md:p-8">
          <DemoBanner />
          <BillingStatusBanner />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
