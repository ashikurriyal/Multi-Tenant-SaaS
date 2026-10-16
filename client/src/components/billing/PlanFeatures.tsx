import { Check } from "lucide-react";
import { formatMicros, formatUnits } from "@/lib/format";
import type { Plan } from "@/types/api";

export default function PlanFeatures({ plan }: { plan: Plan }) {
  const items = [
    `${plan.seatLimit} seats`,
    `${formatUnits(plan.includedUnits)} units / month included`,
    plan.overageUnitMicros > 0
      ? `${formatMicros(plan.overageUnitMicros)} per extra unit`
      : "Hard limit, no overage",
  ];
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
