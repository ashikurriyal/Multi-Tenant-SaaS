"use client";

import { Button } from "@/components/ui/button";

export const MONTH_OPTIONS = [6, 12, 24] as const;

type Props = { value: number; onChange: (months: number) => void };

export default function MonthsSelect({ value, onChange }: Props) {
  return (
    <div className="flex gap-1" role="group" aria-label="Months shown">
      {MONTH_OPTIONS.map((months) => (
        <Button
          key={months}
          size="sm"
          variant={value === months ? "default" : "outline"}
          aria-pressed={value === months}
          onClick={() => onChange(months)}
        >
          {months} months
        </Button>
      ))}
    </div>
  );
}
