"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMoney, formatMonth } from "@/lib/format";
import type { MrrMonth } from "@/types/api";

const config = { mrr: { label: "MRR", color: "var(--primary)" } } satisfies ChartConfig;
const compactMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
});

export default function MrrChart({ months }: { months: MrrMonth[] }) {
  const data = months.map((m) => ({ month: m.month, mrr: m.mrrCents / 100 }));
  const last = months.at(-1);
  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-64 w-full"
      role="img"
      aria-label={`MRR by month${last ? `, currently ${formatMoney(last.mrrCents)}` : ""}`}
    >
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
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
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(m) => formatMonth(String(m))}
              formatter={(value) => (
                <span className="font-mono tabular-nums">
                  {formatMoney(Math.round(Number(value) * 100))}
                </span>
              )}
            />
          }
        />
        <Area
          dataKey="mrr"
          type="monotone"
          stroke="var(--color-mrr)"
          fill="var(--color-mrr)"
          fillOpacity={0.12}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
