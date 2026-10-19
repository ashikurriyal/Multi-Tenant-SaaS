"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMonth, formatSignedMoney } from "@/lib/format";
import type { MrrMonth } from "@/types/api";

// Gains stack above zero, losses below (SRS 12.4 movements). Colors are the theme's
// chart palette (globals.css), in the same order as the landing page's chart.
export const MOVEMENT_CONFIG = {
  new: { label: "New", color: "var(--chart-1)" },
  expansion: { label: "Expansion", color: "var(--chart-2)" },
  reactivation: { label: "Reactivation", color: "var(--chart-3)" },
  contraction: { label: "Contraction", color: "var(--chart-4)" },
  churned: { label: "Churned", color: "var(--chart-5)" },
} satisfies ChartConfig;

const compactMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
});

export default function MovementsChart({ months }: { months: MrrMonth[] }) {
  const data = months.map((m) => ({
    month: m.month,
    new: m.newCents / 100,
    expansion: m.expansionCents / 100,
    reactivation: m.reactivationCents / 100,
    contraction: -m.contractionCents / 100,
    churned: -m.churnedCents / 100,
  }));

  return (
    <ChartContainer
      config={MOVEMENT_CONFIG}
      className="aspect-auto h-72 w-full"
      role="img"
      aria-label="MRR movements by month: new, expansion and reactivation above zero; contraction and churn below. The table below has the same numbers."
    >
      <BarChart data={data} stackOffset="sign" margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={16}
          tickFormatter={(m: string) => formatMonth(m, true)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v: number) => compactMoney.format(v)}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(m) => formatMonth(String(m))}
              formatter={(value, name) => (
                <div className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">
                    {MOVEMENT_CONFIG[name as keyof typeof MOVEMENT_CONFIG]?.label ?? name}
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatSignedMoney(Math.round(Number(value) * 100))}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent className="flex-wrap gap-x-4 gap-y-1" />} />
        {(Object.keys(MOVEMENT_CONFIG) as (keyof typeof MOVEMENT_CONFIG)[]).map((key) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="movements"
            fill={`var(--color-${key})`}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
