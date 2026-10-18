"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import MonthsSelect, { MONTH_OPTIONS } from "@/components/admin/MonthsSelect";
import MovementsChart from "@/components/admin/MovementsChart";
import MrrChart from "@/components/admin/MrrChart";
import PageHeader from "@/components/app/PageHeader";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
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
import {
  formatDate,
  formatMoney,
  formatMonth,
  formatPercent,
  formatSignedMoney,
} from "@/lib/format";
import { useGetChurnMetricsQuery, useGetMrrMetricsQuery } from "@/redux/api/adminApi";
import type { ChurnMonth, MrrMonth } from "@/types/api";

// SRS 17.1 /admin: MRR chart, movements table, churn/NRR/ARPA cards (FR-AN-03)
export default function AdminRevenuePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = Number(searchParams.get("months"));
  const months = (MONTH_OPTIONS as readonly number[]).includes(requested) ? requested : 12;

  const mrr = useGetMrrMetricsQuery(months);
  const churn = useGetChurnMetricsQuery(months);
  // currentData, not data: while a new range loads, `data` still holds the previous range,
  // and the two requests can finish at different times (12 months of one, 24 of the other)
  const mrrData = mrr.currentData;
  const churnData = churn.currentData;

  const setMonths = (next: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("months", String(next));
    router.replace(`${pathname}?${params}`, { scroll: false });
  };

  const header = (
    <PageHeader
      title="Revenue"
      description="Recurring plan revenue across all organizations, from the daily MRR snapshots"
      actions={<MonthsSelect value={months} onChange={setMonths} />}
    />
  );

  if (mrr.isError || churn.isError) {
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        {header}
        <ErrorState
          message="Couldn't load revenue metrics."
          onRetry={() => {
            mrr.refetch();
            churn.refetch();
          }}
        />
      </div>
    );
  }
  if (!mrrData || !churnData) {
    return (
      <div className="mx-auto max-w-6xl space-y-8" aria-busy="true">
        {header}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const hasData = mrrData.some((m) => m.asOf !== null);
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {header}
      {!hasData ? (
        <EmptyState
          title="No MRR snapshots yet"
          description="The mrr-snapshot job records every organization's MRR once a day; the charts fill in from its first run."
        />
      ) : (
        <>
          <KpiCards mrr={mrrData} churn={churnData} />
          <Card>
            <CardHeader>
              <CardTitle>MRR</CardTitle>
              <CardDescription>
                Month-end values; the current month uses the latest snapshot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MrrChart months={mrrData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>MRR movements</CardTitle>
              <CardDescription>
                Gains above zero, losses below. Trials and overage are not MRR.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MovementsChart months={mrrData} />
            </CardContent>
          </Card>
          <MetricsTable mrr={mrrData} churn={churnData} />
        </>
      )}
    </div>
  );
}

function KpiCards({ mrr, churn }: { mrr: MrrMonth[]; churn: ChurnMonth[] }) {
  const current = mrr.at(-1)!;
  const currentChurn = churn.at(-1);
  // Rates over a partial month understate churn, so they use the last complete month
  const lastFull = churn.at(-2);

  const cards = [
    {
      label: "MRR",
      value: formatMoney(current.mrrCents),
      note: `${formatSignedMoney(current.netNewCents)} this month${current.asOf ? ` (to ${formatDate(current.asOf)})` : ""}`,
    },
    {
      label: "Paying customers",
      value: String(current.payingCustomers),
      note:
        currentChurn?.arpaCents == null ? "ARPA —" : `ARPA ${formatMoney(currentChurn.arpaCents)}`,
    },
    {
      label: "Customer churn",
      value: formatPercent(lastFull?.customerChurnPercent),
      note: lastFull
        ? `${formatMonth(lastFull.month)} · ${lastFull.churnedCustomers} of ${lastFull.startCustomers} lost`
        : "Needs a full month of data",
    },
    {
      label: "Net revenue retention",
      value: formatPercent(lastFull?.nrrPercent),
      note: lastFull ? formatMonth(lastFull.month) : "Needs a full month of data",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader>
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{card.value}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{card.note}</CardContent>
        </Card>
      ))}
    </div>
  );
}

// Newest month first; churn figures are matched by month, never by position
function MetricsTable({ mrr, churn }: { mrr: MrrMonth[]; churn: ChurnMonth[] }) {
  const churnByMonth = new Map(churn.map((c) => [c.month, c]));
  const rows = mrr.map((m) => ({ m, c: churnByMonth.get(m.month) })).reverse();
  const money = (cents: number) => (cents === 0 ? "—" : formatMoney(cents));

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead className="text-right">MRR</TableHead>
            <TableHead className="text-right">New</TableHead>
            <TableHead className="text-right">Expansion</TableHead>
            <TableHead className="text-right">Reactivation</TableHead>
            <TableHead className="text-right">Contraction</TableHead>
            <TableHead className="text-right">Churned</TableHead>
            <TableHead className="text-right">Net new</TableHead>
            <TableHead className="text-right">Customers</TableHead>
            <TableHead className="text-right">Churn</TableHead>
            <TableHead className="text-right">NRR</TableHead>
            <TableHead className="text-right">ARPA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="tabular-nums">
          {rows.map(({ m, c }, i) => (
            <TableRow key={m.month}>
              <TableCell className="font-medium whitespace-nowrap">
                {formatMonth(m.month)}
                {i === 0 && <span className="ml-1 text-xs text-muted-foreground">(to date)</span>}
              </TableCell>
              <TableCell className="text-right">{formatMoney(m.mrrCents)}</TableCell>
              <TableCell className="text-right">{money(m.newCents)}</TableCell>
              <TableCell className="text-right">{money(m.expansionCents)}</TableCell>
              <TableCell className="text-right">{money(m.reactivationCents)}</TableCell>
              <TableCell className="text-right">{money(m.contractionCents)}</TableCell>
              <TableCell className="text-right">{money(m.churnedCents)}</TableCell>
              <TableCell className="text-right font-medium">
                {m.netNewCents === 0 ? "—" : formatSignedMoney(m.netNewCents)}
              </TableCell>
              <TableCell className="text-right">{c ? c.endCustomers : "—"}</TableCell>
              <TableCell className="text-right">{formatPercent(c?.customerChurnPercent)}</TableCell>
              <TableCell className="text-right">{formatPercent(c?.nrrPercent)}</TableCell>
              <TableCell className="text-right">
                {c?.arpaCents == null ? "—" : formatMoney(c.arpaCents)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
