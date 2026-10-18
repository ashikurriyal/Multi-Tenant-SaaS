"use client";

import { useState } from "react";
import AuditTimeline from "@/components/audit/AuditTimeline";
import PageHeader from "@/components/app/PageHeader";
import Pager from "@/components/app/Pager";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useSearchParamsState } from "@/hooks/useSearchParamsState";
import { useListAuditLogsQuery } from "@/redux/api/auditApi";
import type { AuditCategory } from "@/types/api";

const LIMIT = 25;
const CATEGORIES: { value: AuditCategory | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "members", label: "Members" },
  { value: "api_keys", label: "API keys" },
  { value: "billing", label: "Billing" },
  { value: "usage", label: "Usage" },
  { value: "organization", label: "Organization" },
];

const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// SRS 17.1 /[orgSlug]/settings/audit, FR-AUD-03: owners and admins (audit:read)
export default function AuditLogPage() {
  const { org, me, can } = useActiveOrg();
  const allowed = can("audit:read");
  const { searchParams, page, set } = useSearchParamsState();
  const category = CATEGORIES.find((c) => c.value === searchParams.get("category"))?.value ?? null;
  // "Today"/"Yesterday" labels: read the clock once per visit, not on every render
  const [days] = useState(() => {
    const now = new Date();
    return { today: localDay(now), yesterday: localDay(new Date(now.getTime() - 86_400_000)) };
  });

  const { data, isLoading, isError, isFetching, refetch } = useListAuditLogsQuery(
    { orgId: org?.id ?? "", page, limit: LIMIT, ...(category && { category }) },
    { skip: !org || !allowed },
  );

  if (!org) return null;
  if (!allowed) {
    return (
      <p className="text-sm text-muted-foreground">Only owners and admins can see the audit log.</p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Audit log"
        description="Who changed what in this organization. Entries are permanent."
      />

      <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by category">
        {CATEGORIES.map((c) => (
          <Button
            key={c.label}
            size="sm"
            variant={c.value === category ? "default" : "outline"}
            aria-pressed={c.value === category}
            onClick={() => set({ category: c.value })}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {isError ? (
        <ErrorState message="Couldn't load the audit log." onRetry={refetch} />
      ) : isLoading || !data ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <EmptyState
          title={category ? "Nothing in this category yet" : "No changes recorded yet"}
          description="Invitations, role changes, API keys and billing changes appear here."
        />
      ) : (
        <div className={isFetching ? "space-y-6 opacity-60" : "space-y-6"}>
          <AuditTimeline entries={data.data} meId={me?.id} {...days} />
          <Pager meta={data.meta} noun="entries" onPage={(p) => set({ page: p })} />
        </div>
      )}
    </div>
  );
}
