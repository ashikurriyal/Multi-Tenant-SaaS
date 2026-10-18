"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const PRESETS = [7, 30, 90] as const;
const ALL = "__all";

type Props = {
  from: string;
  to: string;
  today: string;
  metric: string | null;
  metrics: string[];
  activePreset: number | null;
  onPreset: (days: number) => void;
  onRange: (from: string, to: string) => void;
  onMetric: (metric: string | null) => void;
};

export default function UsageRangeControls({
  from,
  to,
  today,
  metric,
  metrics,
  activePreset,
  onPreset,
  onRange,
  onMetric,
}: Props) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2">
        <span className="text-sm font-medium">Range</span>
        <div className="flex gap-1" role="group" aria-label="Quick ranges">
          {PRESETS.map((days) => (
            <Button
              key={days}
              size="sm"
              variant={activePreset === days ? "default" : "outline"}
              aria-pressed={activePreset === days}
              onClick={() => onPreset(days)}
            >
              {days} days
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="usage-from">From</Label>
        <Input
          id="usage-from"
          type="date"
          className="w-40"
          value={from}
          max={to || today}
          onChange={(e) => e.target.value && onRange(e.target.value, to)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="usage-to">To</Label>
        <Input
          id="usage-to"
          type="date"
          className="w-40"
          value={to}
          min={from}
          max={today}
          onChange={(e) => e.target.value && onRange(from, e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="usage-metric">Metric</Label>
        <Select value={metric ?? ALL} onValueChange={(v) => onMetric(v === ALL ? null : v)}>
          <SelectTrigger id="usage-metric" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All metrics</SelectItem>
            {/* Keep a metric from the URL selectable even if it has no data in this range */}
            {[...new Set([...metrics, ...(metric ? [metric] : [])])].map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
