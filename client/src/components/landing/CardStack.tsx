"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// The final call to action's stack of demo accounts. The cards sit stacked until the stack
// scrolls into view, then fan out; they stack back up once it leaves the screen, so the
// spread plays again on the next visit. Visitors who prefer reduced motion see them spread.
//
// Phones (480px and below) get narrower cards and a smaller fan so they stay inside the
// panel.

// Back to front. Each card's stacked and spread positions, how long it waits before
// moving (back cards spread last), and how long its float takes.
const STACK = [
  {
    initials: "IN",
    avatar: "bg-ink-soft",
    org: "Initech",
    pill: { label: "Free · 95%", className: "bg-line-soft text-[#3F4B52]" },
    meter: { label: "Usage", value: "950 / 1,000", pct: 95, color: "#C0352B" },
    stacked:
      "[transform:translate(28px,-112px)_rotate(7deg)_scale(0.92)] max-[480px]:[transform:translate(16px,-100px)_rotate(5deg)_scale(0.92)]",
    spread:
      "[transform:translate(70px,-150px)_rotate(9deg)_scale(0.94)] max-[480px]:[transform:translate(20px,-118px)_rotate(7deg)_scale(0.92)]",
    delay: "delay-160",
    className: "opacity-85",
    float: "motion-safe:[animation:lf-float_8s_ease-in-out_1.6s_infinite]",
  },
  {
    initials: "GL",
    avatar: "bg-[#7A2E1E]",
    org: "Globex",
    pill: { label: "Past due", className: "bg-[#FCEDE8] text-[#A33A1E]" },
    meter: { label: "Grace period", value: "7 days", pct: 14, color: "#E0533F" },
    stacked:
      "[transform:translate(-26px,-70px)_rotate(-5deg)_scale(0.96)] max-[480px]:[transform:translate(-14px,-62px)_rotate(-4deg)_scale(0.96)]",
    spread:
      "[transform:translate(-70px,-82px)_rotate(-8deg)_scale(0.97)] max-[480px]:[transform:translate(-20px,-72px)_rotate(-6deg)_scale(0.95)]",
    delay: "delay-80",
    className: "opacity-93",
    float: "motion-safe:[animation:lf-float_7s_ease-in-out_0.8s_infinite]",
  },
  {
    initials: "AC",
    avatar: "bg-ink",
    org: "Acme Corp",
    pill: { label: "Pro · active", className: "bg-primary/10 text-brand-deep" },
    meter: { label: "Usage", value: "81%", pct: 81, color: "#C27C0E" },
    stacked: "[transform:translate(0,-10px)_rotate(1deg)]",
    spread:
      "[transform:translate(14px,18px)_rotate(2deg)_scale(1.02)] max-[480px]:[transform:translate(4px,8px)_rotate(2deg)]",
    delay: "delay-0",
    className: "",
    float: "motion-safe:[animation:lf-float_6s_ease-in-out_infinite]",
  },
];

export default function CardStack() {
  const ref = useRef<HTMLDivElement>(null);
  const [spread, setSpread] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time switch to the final state
      setSpread(true);
      return;
    }
    // Spread once half the stack is on screen; stack back only when it is fully gone, so
    // small scrolls around the edge don't make it flicker
    const seen = new IntersectionObserver(
      ([en]) => {
        if (en.intersectionRatio >= 0.5) setSpread(true);
        else if (!en.isIntersecting) setSpread(false);
      },
      { threshold: [0, 0.5] },
    );
    seen.observe(el);
    return () => seen.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      data-spread={spread}
      className="relative h-75 max-[900px]:mx-auto max-[900px]:h-65 max-[900px]:w-full max-[900px]:max-w-105"
    >
      {STACK.map((c) => (
        <div
          key={c.org}
          className={cn(
            "absolute top-1/2 left-1/2 -ml-37.5 flex w-75 flex-col gap-2.5 rounded-[16px] border border-line bg-white p-4 text-ink shadow-[0_24px_50px_-24px_rgba(0,0,0,0.7)] max-[480px]:inset-x-1 max-[480px]:ml-0 max-[480px]:w-auto",
            "motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.3,1.2,0.4,1)]",
            spread ? cn(c.spread, c.delay) : c.stacked,
            c.className,
            c.float,
          )}
        >
          <div className="flex items-center justify-between gap-2.5">
            <span className="inline-flex items-center gap-2.5">
              <span
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-[9px] text-[12px] font-semibold text-white",
                  c.avatar,
                )}
              >
                {c.initials}
              </span>
              <span className="flex flex-col gap-0.75">
                <span className="text-[14px] leading-none font-semibold whitespace-nowrap">
                  {c.org}
                </span>
                <span className="text-[11.5px] leading-none text-subtle">Owner</span>
              </span>
            </span>
            <span
              className={cn(
                "rounded-full px-2.25 py-0.75 text-[11.5px] font-semibold whitespace-nowrap",
                c.pill.className,
              )}
            >
              {c.pill.label}
            </span>
          </div>
          <div className="flex justify-between text-[11.5px] text-subtle">
            <span>{c.meter.label}</span>
            <span className="font-semibold" style={{ color: c.meter.color }}>
              {c.meter.value}
            </span>
          </div>
          <span className="block h-1.5 overflow-hidden rounded-full bg-[#E6ECEA]">
            <span
              className="block h-full rounded-full"
              style={{ width: `${c.meter.pct}%`, background: c.meter.color }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}
