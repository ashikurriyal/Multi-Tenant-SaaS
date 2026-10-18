"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatDay, formatUnits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DailyUsage } from "@/types/api";

const config = { units: { label: "Units", color: "var(--primary)" } } satisfies ChartConfig;
const compact = new Intl.NumberFormat("en-US", { notation: "compact" });

type Props = { days: DailyUsage["days"]; className?: string };

// Daily usage bars (UTC days). The table on the usage page has the same numbers as text.
export default function UsageChart({ days, className }: Props) {
  const total = days.reduce((sum, d) => sum + d.units, 0);
  return (
    <ChartContainer
      config={config}
      className={cn("aspect-auto h-64 w-full", className)}
      aria-label={`Daily usage from ${formatDay(days[0]?.day ?? "")} to ${formatDay(days.at(-1)?.day ?? "")}: ${formatUnits(total)} units in total`}
      role="img"
    >
      <BarChart data={days} margin={{ left: 0, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(day: string) => formatDay(day)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          allowDecimals={false}
          tickFormatter={(value: number) => compact.format(value)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent labelFormatter={(day) => formatDay(String(day), true)} />}
        />
        {/* No grow-in animation: the numbers should be readable the moment they load */}
        <Bar
          dataKey="units"
          fill="var(--color-units)"
          radius={[3, 3, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  );
}
