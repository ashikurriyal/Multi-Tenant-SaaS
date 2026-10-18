"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Recharts loads after the cards and tables; each box keeps its final height meanwhile
export const LazyMrrChart = dynamic(() => import("./MrrChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
});

export const LazyMovementsChart = dynamic(() => import("./MovementsChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full" />,
});
