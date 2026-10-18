"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LazyUsageChart from "@/components/usage/LazyUsageChart";
import UsageRangeControls, { PRESETS } from "@/components/usage/UsageRangeControls";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { formatDay, formatUnits } from "@/lib/format";
import { useGetDailyUsageQuery } from "@/redux/api/usageApi";

const DAY_MS = 86_400_000;
const MAX_DAYS = 90; // FR-USE-08
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const spanDays = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1;

// SRS 17.1/17.2: daily usage with the range and metric in the URL (?from&to&metric)
export default function UsagePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { org } = useActiveOrg();

  // Days are UTC, like the API's rollups. Read once per visit, not on every render.
  const [today] = useState(() => isoDay(Date.now()));
  const toParam = searchParams.get("to");
  const fromParam = searchParams.get("from");
  const to = toParam && DATE.test(toParam) ? toParam : today;
  const from = fromParam && DATE.test(fromParam) ? fromParam : isoDay(Date.parse(to) - 29 * DAY_MS);
  const metric = searchParams.get("metric");

  const rangeError =
    from > to
      ? "“From” must not be after “To”."
      : spanDays(from, to) > MAX_DAYS
        ? `Pick at most ${MAX_DAYS} days.`
        : null;

  const { data, isLoading, isError, isFetching, refetch } = useGetDailyUsageQuery(
    { orgId: org?.id ?? "", from, to, ...(metric && { metric }) },
    { skip: !org || Boolean(rangeError) },
  );

  const update = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`${pathname}?${params}`, { scroll: false });
  };

  const activePreset =
    to === today ? (PRESETS.find((days) => spanDays(from, to) === days) ?? null) : null;
  const rows = data ? [...data.days].reverse() : [];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Usage"
        description="Units reported by your apps through the usage API, per day (UTC)"
      />

      <UsageRangeControls
        from={from}
        to={to}
        today={today}
        metric={metric}
        metrics={data?.metrics ?? []}
        activePreset={activePreset}
        onPreset={(days) =>
          update({ from: isoDay(Date.parse(today) - (days - 1) * DAY_MS), to: today })
        }
        onRange={(nextFrom, nextTo) => update({ from: nextFrom, to: nextTo })}
        onMetric={(next) => update({ metric: next })}
      />

      {rangeError ? (
        <Alert variant="destructive">
          <AlertDescription>{rangeError}</AlertDescription>
        </Alert>
      ) : isError ? (
        <ErrorState message="Couldn't load usage." onRetry={refetch} />
      ) : isLoading || !data ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className={isFetching ? "space-y-8 opacity-60" : "space-y-8"}>
          <Card>
            <CardHeader>
              <CardTitle>{formatUnits(data.totalUnits)} units</CardTitle>
              <CardDescription>
                {formatDay(data.from, true)} – {formatDay(data.to, true)}
                {data.metric ? ` · ${data.metric}` : " · all metrics"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.totalUnits === 0 ? (
                <EmptyState
                  title="No usage in this range"
                  description="Try a longer range, or check that your app is reporting usage."
                />
              ) : (
                <LazyUsageChart days={data.days} className="h-72" />
              )}
            </CardContent>
          </Card>

          {data.totalUnits > 0 && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day (UTC)</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.day}>
                      <TableCell>{formatDay(row.day, true)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatUnits(row.units)}
                      </TableCell>
                      <TableCell className="hidden text-right text-muted-foreground tabular-nums sm:table-cell">
                        {((row.units / data.totalUnits) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
