import { cn } from "@/lib/utils";
import EventFeed from "./EventFeed";
import type { State } from "./script";

// Typical text sizes inside the mock (relative to its em)
const label = "text-[0.72em] leading-none text-subtle";
const note = "text-[0.68em] leading-none text-subtle";
const card = "flex flex-col rounded-[0.8em] border border-line px-[1.2em] py-[1.1em]";

// Usage meter, plan card and the live API feed; the limit banner appears once usage is rejected
export default function Dashboard({ s }: { s: State }) {
  const pro = s.plan === "pro";
  const pct = Math.min(100, Math.round((s.used / s.limit) * 1000) / 10);
  const warn = !pro && pct >= 80;
  const tone = s.limitHit ? "hit" : warn ? "warn" : "ok";

  return (
    <div className="flex min-h-0 flex-1 animate-scene flex-col gap-[1em]">
      {s.limitHit && <LimitBanner pressed={s.press === "upgrade"} />}
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-[1em]">
        <div className="flex min-h-0 flex-col gap-[1em]">
          <div className={cn(card, "gap-[0.8em]")}>
            <div className="flex items-center justify-between">
              <span className={label}>Usage this period</span>
              <span
                className={cn(
                  "text-[0.72em] leading-none font-semibold",
                  { hit: "text-[#B42C22]", warn: "text-[#8A3F06]", ok: "text-brand-deep" }[tone],
                )}
              >
                {(pro ? Math.max(1, Math.round(pct)) : Math.round(pct)) + "%"}
              </span>
            </div>
            <div className="flex items-baseline gap-[0.35em]">
              <span className="text-[1.9em] leading-none font-[650] tracking-[-0.02em] tabular-nums">
                {s.used.toLocaleString("en-US")}
              </span>
              <span className="text-[0.9em] leading-none text-subtle tabular-nums">
                / {s.limit.toLocaleString("en-US")}
              </span>
            </div>
            <span className="block h-[0.55em] overflow-hidden rounded-full bg-[#E9EEEC]">
              <span
                style={{ width: `${pct}%` }}
                className={cn(
                  "block h-full rounded-full transition-[width,background-color] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
                  { hit: "bg-[#C0352B]", warn: "bg-[#D99A1E]", ok: "bg-primary" }[tone],
                )}
              />
            </span>
            <span className={note}>
              {s.limitHit
                ? "Limit reached · new usage is rejected"
                : pro
                  ? "Within the 50,000 included units"
                  : Math.round(pct) + "% of the Free limit"}
            </span>
          </div>
          <div className={cn(card, "gap-[0.7em]")}>
            <span className={label}>Plan</span>
            <span className="text-[1.35em] leading-none font-[650]">{pro ? "Pro" : "Free"}</span>
            <span className="text-[0.68em] leading-[1.3] text-subtle">
              {pro
                ? "50,000 units included · $0.002 per extra unit"
                : "1,000 units a month · hard limit"}
            </span>
          </div>
        </div>
        <EventFeed feed={s.feed} />
      </div>
    </div>
  );
}

function LimitBanner({ pressed }: { pressed: boolean }) {
  return (
    <div className="flex animate-pop items-center gap-[0.9em] rounded-[0.75em] border border-[#F2C7BC] bg-[#FDF1EE] py-[0.8em] pr-[0.9em] pl-[1em]">
      <span className="inline-flex size-[1.7em] flex-none items-center justify-center rounded-full bg-destructive">
        <span className="text-[0.78em] leading-none font-bold text-white">!</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[0.35em]">
        <span className="text-[0.78em] leading-none font-semibold text-[#8E2A20]">
          Monthly usage limit reached
        </span>
        <span className="text-[0.68em] leading-[1.2] text-[#8E2A20]">
          New usage is rejected until the limit resets on Nov 1.
        </span>
      </span>
      <span
        data-lf="upgrade"
        className={cn(
          "inline-flex h-[2.3em] flex-none items-center justify-center rounded-[0.55em] px-[1.1em] transition-[background-color] duration-150",
          pressed ? "bg-[#8E2A20]" : "bg-[#C0352B]",
        )}
      >
        <span className="text-[0.74em] leading-none font-medium text-white">Upgrade plan</span>
      </span>
    </div>
  );
}
