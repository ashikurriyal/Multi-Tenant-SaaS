"use client";

import Link from "next/link";
import PageHeader from "@/components/app/PageHeader";
import ErrorState from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import LazyUsageChart from "@/components/usage/LazyUsageChart";
import UsageOverview from "@/components/usage/UsageOverview";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useSettledOnce } from "@/hooks/useSettledOnce";
import { formatUnits } from "@/lib/format";
import { useGetDailyUsageQuery, useGetUsageSummaryQuery } from "@/redux/api/usageApi";

// FR-AN-01: usage vs quota, 30-day chart, plan, renewal date and projected overage
export default function DashboardPage() {
  const { org } = useActiveOrg();
  // No range: the API returns the last 30 days
  const daily = useGetDailyUsageQuery({ orgId: org?.id ?? "" }, { skip: !org });
  // Same cached request UsageOverview makes. Waiting for both before rendering means the
  // usage banner, cards and chart appear together instead of pushing each other down (CLS)
  const summary = useGetUsageSummaryQuery(org?.id ?? "", { skip: !org });
  const settled = (q: { isSuccess: boolean; isError: boolean }) => q.isSuccess || q.isError;
  // Stays true while a failed request is retried, so it can't loop (see useSettledOnce)
  const ready = useSettledOnce(org?.id, settled(daily) && settled(summary));

  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl space-y-8" aria-busy="true">
        <PageHeader title="Dashboard" description={org?.name} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader title="Dashboard" description={org?.name} />
      <UsageOverview />
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
          <div className="space-y-1.5">
            <CardTitle>Last 30 days</CardTitle>
            <CardDescription>
              {daily.data
                ? `${formatUnits(daily.data.totalUnits)} units · days in UTC, updated every few minutes`
                : "Daily usage"}
            </CardDescription>
          </div>
          {org && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/${org.slug}/usage`}>View details</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {daily.isError ? (
            <ErrorState message="Couldn't load daily usage." onRetry={daily.refetch} />
          ) : daily.data ? (
            daily.data.totalUnits === 0 ? (
              <NoUsageYet slug={org?.slug} />
            ) : (
              <LazyUsageChart days={daily.data.days} />
            )
          ) : (
            <Skeleton className="h-64 w-full" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NoUsageYet({ slug }: { slug?: string }) {
  const { can } = useActiveOrg();
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
      <p className="font-medium">No usage in the last 30 days</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Usage appears here once your app reports it to <code>POST /api/v1/usage</code> with an API
        key.
      </p>
      {slug && can("apikeys:manage") && (
        <Button asChild size="sm" className="mt-2">
          <Link href={`/${slug}/settings/api-keys`}>Create an API key</Link>
        </Button>
      )}
    </div>
  );
}
