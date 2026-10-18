"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import PageSkeleton from "@/components/auth/PageSkeleton";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useSettledOnce } from "@/hooks/useSettledOnce";
import BillingStatusBanner from "@/components/billing/BillingStatusBanner";
import DemoBanner from "./DemoBanner";
import AppSidebar from "./AppSidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { org, detailsSettled: settledNow } = useActiveOrg();
  // Stays true while a failed request is retried (see useSettledOnce)
  const detailsSettled = useSettledOnce(org?.id, settledNow);

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
          {/* The banners depend on the org details; showing them together with the page
              (not popping in above it later) keeps the layout from jumping (CLS). The page
              is mounted hidden meanwhile, so its own data requests start right away. */}
          {detailsSettled && (
            <>
              <DemoBanner />
              <BillingStatusBanner />
            </>
          )}
          {!detailsSettled && <PageSkeleton />}
          <div hidden={!detailsSettled}>{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
