import { cn } from "@/lib/utils";
import type { Scene } from "./script";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    lines: ["3 seats", "1,000 units a month", "Hard limit, no overage"],
  },
  {
    name: "Pro",
    price: "$49",
    lines: ["10 seats", "50,000 units included", "$0.002 per extra unit"],
  },
  {
    name: "Business",
    price: "$199",
    lines: ["50 seats", "500,000 units included", "$0.001 per extra unit"],
  },
];

// The three plans; the cursor picks Pro
export default function Billing({ press }: { press: Scene["press"] }) {
  return (
    <div className="flex animate-scene flex-col gap-[1em]">
      <div className="grid grid-cols-3 items-stretch gap-[1em]">
        {PLANS.map((p) => {
          const pro = p.name === "Pro";
          return (
            <div
              key={p.name}
              className={cn(
                "flex flex-col gap-[0.8em] rounded-[0.9em]",
                pro
                  ? "border-2 border-primary p-[calc(1.2em-1px)] shadow-[0_1em_2em_-1.4em_color-mix(in_srgb,var(--color-primary)_70%,transparent)]"
                  : "border border-line p-[1.2em]",
              )}
            >
              <span className="flex items-center justify-between">
                <span className="text-[0.8em] leading-none font-semibold">{p.name}</span>
                {pro && (
                  <span className="inline-flex h-[1.5em] items-center rounded-full bg-primary px-[0.6em]">
                    <span className="text-[0.58em] leading-none font-semibold text-white">
                      Most teams
                    </span>
                  </span>
                )}
              </span>
              <span className="flex items-baseline gap-[0.3em]">
                <span className="text-[1.8em] leading-none font-[650]">{p.price}</span>
                <span className="text-[0.7em] leading-none text-subtle">/ month</span>
              </span>
              <span className="flex flex-col gap-[0.5em]">
                {p.lines.map((l) => (
                  <span key={l} className="text-[0.68em] leading-none text-body">
                    {l}
                  </span>
                ))}
              </span>
              <span
                data-lf={pro ? "choose" : undefined}
                className={cn(
                  "mt-auto inline-flex h-[2.3em] items-center justify-center rounded-[0.55em]",
                  p.name === "Free" && "bg-[#F2F5F4] text-subtle",
                  pro && "text-white transition-[background-color] duration-150",
                  pro && (press === "choose" ? "bg-brand-deep" : "bg-primary"),
                  p.name === "Business" && "border border-line-strong",
                )}
              >
                <span className="text-[0.72em] leading-none font-medium">
                  {p.name === "Free" ? "Current plan" : `Choose ${p.name}`}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <span className="text-[0.66em] leading-none text-subtle">
        Payments run in Stripe test mode.
      </span>
    </div>
  );
}
