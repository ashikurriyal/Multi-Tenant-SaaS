"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DailyUsage } from "@/types/api";

// Recharts is the largest script on these pages, and the chart sits below the cards, so it
// loads after the rest. The box keeps its height meanwhile, so nothing shifts (CLS).
const UsageChart = dynamic(() => import("./UsageChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

type Props = { days: DailyUsage["days"]; className?: string };

export default function LazyUsageChart({ days, className }: Props) {
  return (
    <div className={cn("h-64", className)}>
      <UsageChart days={days} className="h-full" />
    </div>
  );
}
