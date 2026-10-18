"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import Pager from "@/components/app/Pager";
import PageHeader from "@/components/app/PageHeader";
import StatusBadge from "@/components/billing/StatusBadge";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSearchParamsState } from "@/hooks/useSearchParamsState";
import { formatDate, formatMoney } from "@/lib/format";
import { useListTenantsQuery } from "@/redux/api/adminApi";
import { useGetPlansQuery } from "@/redux/api/billingApi";
import type { SubscriptionStatus } from "@/types/api";

const LIMIT = 20;
const ALL = "__all";
const STATUSES: SubscriptionStatus[] = [
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "UNPAID",
  "INCOMPLETE",
  "CANCELED",
];
const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  ACTIVE: "Active",
  TRIALING: "Trial",
  PAST_DUE: "Past due",
  UNPAID: "Unpaid",
  INCOMPLETE: "Incomplete",
  CANCELED: "Canceled",
};

// SRS 17.1 /admin/tenants, FR-AN-04: every organization, searchable and filterable
export default function AdminTenantsPage() {
  const { searchParams, page, set } = useSearchParamsState();
  const search = searchParams.get("search") ?? "";
  const plan = searchParams.get("plan") ?? undefined;
  const statusParam = searchParams.get("status");
  const status = STATUSES.find((s) => s === statusParam);

  // Typing updates the URL after a short pause, not on every keystroke
  const [draft, setDraft] = useState(search);
  useEffect(() => {
    if (draft.trim() === search) return;
    const timer = setTimeout(() => set({ search: draft.trim() }), 300);
    return () => clearTimeout(timer);
  }, [draft, search, set]);

  const { data: plans } = useGetPlansQuery();
  const { data, isLoading, isError, isFetching, refetch } = useListTenantsQuery({
    page,
    limit: LIMIT,
    ...(search && { search }),
    ...(plan && { plan }),
    ...(status && { status }),
  });
  const filtered = Boolean(search || plan || status);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Organizations" description="Every organization on the platform" />

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="tenant-search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              id="tenant-search"
              type="search"
              placeholder="Name or slug"
              className="w-64 pl-8"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenant-plan">Plan</Label>
          <Select value={plan ?? ALL} onValueChange={(v) => set({ plan: v === ALL ? null : v })}>
            <SelectTrigger id="tenant-plan" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All plans</SelectItem>
              {(plans ?? []).map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenant-status">Status</Label>
          <Select
            value={status ?? ALL}
            onValueChange={(v) => set({ status: v === ALL ? null : v })}
          >
            <SelectTrigger id="tenant-status" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isError ? (
        <ErrorState message="Couldn't load organizations." onRetry={refetch} />
      ) : isLoading || !data ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <EmptyState
          title={filtered ? "No organizations match" : "No organizations yet"}
          description={filtered ? "Try another search or clear the filters." : undefined}
        />
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead className="text-right">MRR</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={isFetching ? "opacity-60" : undefined}>
                {data.data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">/{t.slug}</div>
                    </TableCell>
                    <TableCell>{t.planName}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <StatusBadge status={t.status} />
                        {t.cancelAtPeriodEnd && (
                          <Badge variant="outline" title={`Ends ${formatDate(t.currentPeriodEnd)}`}>
                            Cancels
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{t.memberCount}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {t.mrrCents ? formatMoney(t.mrrCents) : "—"}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {formatDate(t.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pager meta={data.meta} noun="organizations" onPage={(p) => set({ page: p })} />
        </div>
      )}
    </div>
  );
}
