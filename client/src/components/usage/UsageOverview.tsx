"use client";

import Link from "next/link";
import ErrorState from "@/components/states/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { formatDate, formatMoney, formatUnits } from "@/lib/format";
import { useGetOrganizationQuery } from "@/redux/api/orgApi";
import { useGetUsageSummaryQuery } from "@/redux/api/usageApi";
import UsageLimitBanner from "./UsageLimitBanner";

// Dashboard cards: plan, usage vs quota, projection, seats (FR-AN-01)
export default function UsageOverview() {
  const { org, can } = useActiveOrg();
  const summaryQuery = useGetUsageSummaryQuery(org?.id ?? "", { skip: !org });
  const { data: details } = useGetOrganizationQuery(org?.id ?? "", { skip: !org });
  const s = summaryQuery.data;
  const seats = details?.entitlements;

  if (summaryQuery.isError) {
    return <ErrorState message="Couldn't load usage." onRetry={summaryQuery.refetch} />;
  }

  return (
    <div className="space-y-4">
      {s && <UsageLimitBanner summary={s} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Plan</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              {s ? s.planCode : <Skeleton className="h-8 w-20" />}
              {seats && (
                <Badge variant="secondary">{seats.status.toLowerCase().replace("_", " ")}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {s ? `Period resets ${formatDate(s.periodEnd)}` : <Skeleton className="h-4 w-32" />}
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardDescription>Usage this period</CardDescription>
            <CardTitle className="text-2xl">
              {s ? formatUnits(s.unitsUsed) : <Skeleton className="h-8 w-24" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {s ? (
              <>
                <Progress
                  value={Math.min(100, s.percentUsed)}
                  aria-label={`${s.percentUsed}% of included units used`}
                  className={s.limitReached ? "[&>div]:bg-destructive" : undefined}
                />
                <p className="text-sm text-muted-foreground">
                  {s.percentUsed}% of {formatUnits(s.includedUnits)} included
                </p>
              </>
            ) : (
              <Skeleton className="h-6 w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Projected by period end</CardDescription>
            <CardTitle className="text-2xl">
              {s ? formatUnits(s.projectedUnits) : <Skeleton className="h-8 w-24" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {!s ? (
              <Skeleton className="h-4 w-32" />
            ) : s.overageAllowed ? (
              s.projectedOverageCents > 0 ? (
                `≈ ${formatMoney(s.projectedOverageCents)} overage at the current pace`
              ) : (
                "Within included units at the current pace"
              )
            ) : s.projectedUnits > s.includedUnits ? (
              "On pace to hit the limit before the period ends"
            ) : (
              "Within the limit at the current pace"
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Seats</CardDescription>
            <CardTitle className="text-2xl">
              {seats ? (
                `${seats.seatsUsed} / ${seats.seatLimit}`
              ) : (
                <Skeleton className="h-8 w-20" />
              )}
            </CardTitle>
          </CardHeader>
          {can("members:read") && org && (
            <CardContent>
              <Link
                href={`/${org.slug}/settings/members`}
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Manage members
              </Link>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
