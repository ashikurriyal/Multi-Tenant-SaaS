"use client";

import Pager from "@/components/app/Pager";
import PageHeader from "@/components/app/PageHeader";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatDateTime } from "@/lib/format";
import { useListWebhookEventsQuery } from "@/redux/api/adminApi";
import type { WebhookEventStatus } from "@/types/api";

const LIMIT = 20;
const MAX_ATTEMPTS = 5; // FR-WH-07, same as the retry-webhooks job
const TABS: { status: WebhookEventStatus; label: string }[] = [
  { status: "FAILED", label: "Failed" },
  { status: "RECEIVED", label: "Waiting" },
  { status: "PROCESSING", label: "Processing" },
  { status: "PROCESSED", label: "Processed" },
];

// SRS 17.1 /admin/webhooks, FR-AN-05: the Stripe webhook inbox; failed events by default
export default function AdminWebhooksPage() {
  const { searchParams, page, set } = useSearchParamsState();
  const status = TABS.find((t) => t.status === searchParams.get("status"))?.status ?? "FAILED";
  const { data, isLoading, isError, isFetching, refetch } = useListWebhookEventsQuery({
    page,
    limit: LIMIT,
    status,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Webhook events"
        description={`Stripe events in the inbox. Failed ones are retried with backoff up to ${MAX_ATTEMPTS} times by the retry-webhooks job.`}
      />

      <div className="flex flex-wrap gap-1" role="group" aria-label="Event status">
        {TABS.map((tab) => (
          <Button
            key={tab.status}
            size="sm"
            variant={tab.status === status ? "default" : "outline"}
            aria-pressed={tab.status === status}
            onClick={() => set({ status: tab.status === "FAILED" ? null : tab.status })}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {isError ? (
        <ErrorState message="Couldn't load webhook events." onRetry={refetch} />
      ) : isLoading || !data ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <EmptyState
          title={status === "FAILED" ? "No failed events" : "Nothing here"}
          description={
            status === "FAILED"
              ? "Every Stripe event has been processed or is still being retried."
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                  <TableHead>Last error</TableHead>
                  <TableHead className="hidden md:table-cell">Received</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {status === "PROCESSED" ? "Processed" : "Next attempt"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={isFetching ? "opacity-60" : undefined}>
                {data.data.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="font-medium">{e.type}</div>
                      <code className="text-xs text-muted-foreground">{e.id}</code>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {e.attempts >= MAX_ATTEMPTS && e.status === "FAILED" ? (
                        <Badge variant="destructive" title="Retries exhausted">
                          {e.attempts}/{MAX_ATTEMPTS}
                        </Badge>
                      ) : (
                        `${e.attempts}/${MAX_ATTEMPTS}`
                      )}
                    </TableCell>
                    <TableCell className="max-w-sm">
                      <p
                        className="line-clamp-2 text-sm break-words"
                        title={e.lastError ?? undefined}
                      >
                        {e.lastError ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-sm whitespace-nowrap md:table-cell">
                      {formatDateTime(e.receivedAt)}
                    </TableCell>
                    <TableCell className="hidden text-sm whitespace-nowrap lg:table-cell">
                      {status === "PROCESSED"
                        ? e.processedAt
                          ? formatDateTime(e.processedAt)
                          : "—"
                        : e.nextAttemptAt
                          ? formatDateTime(e.nextAttemptAt)
                          : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pager meta={data.meta} noun="events" onPage={(p) => set({ page: p })} />
        </div>
      )}
    </div>
  );
}
