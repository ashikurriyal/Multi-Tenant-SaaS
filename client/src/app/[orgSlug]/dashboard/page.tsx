"use client";

import Link from "next/link";
import PageHeader from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useGetOrganizationQuery } from "@/redux/api/orgApi";

const units = new Intl.NumberFormat();

// Usage charts and quota banners arrive in Phase 3
export default function DashboardPage() {
  const { org, can } = useActiveOrg();
  const { data, isLoading } = useGetOrganizationQuery(org?.id ?? "", { skip: !org });
  const e = data?.entitlements;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader title="Dashboard" description={org?.name} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Plan</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              {isLoading || !e ? <Skeleton className="h-8 w-20" /> : e.planCode}
              {e && <Badge variant="secondary">{e.status.toLowerCase()}</Badge>}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Seats</CardDescription>
            <CardTitle className="text-2xl">
              {isLoading || !e ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                `${e.seatsUsed} / ${e.seatLimit}`
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
        <Card>
          <CardHeader>
            <CardDescription>Included usage / month</CardDescription>
            <CardTitle className="text-2xl">
              {isLoading || !e ? <Skeleton className="h-8 w-24" /> : units.format(e.includedUnits)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
