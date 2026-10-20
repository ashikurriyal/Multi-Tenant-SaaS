"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import GlowFrame from "./GlowFrame";

// The hero's scripted product walkthrough (about 16 s, looping): Initech's Free workspace
// reports usage until the limit holds, upgrades to Pro with a test card, and usage flows
// again once Stripe confirms. Visitors who prefer reduced motion see the final state.
//
// Everything inside the app is sized in em off one font size (1/67 of the frame's width,
// a container query unit), so the whole mock scales like a screenshot.

type FeedEntry = { code: "202" | "429"; text: string };
type Scene = {
  scene: "dash" | "billing";
  plan: "free" | "pro";
  used: number;
  limit: number;
  limitHit: boolean;
  feed: FeedEntry[];
  checkout: boolean;
  cardText: string;
  cardFocus: boolean;
  paying: boolean;
  toast: boolean;
  clicking: boolean;
  press: "" | "upgrade" | "choose" | "card" | "pay";
};
type State = Scene & { cx: number; cy: number; mode: "play" | "static"; paused: boolean };
type Target = "upgrade" | "choose" | "card" | "pay";

const CARD = "4242 4242 4242 4242";
const FREE_LIMIT = 1000;
const PRO_LIMIT = 50000;
const ok = (units: number): FeedEntry => ({ code: "202", text: `documents_processed · +${units}` });
const rejected = (): FeedEntry => ({ code: "429", text: "PLAN_LIMIT_USAGE · rejected" });

const START: Scene = {
  scene: "dash",
  plan: "free",
  used: 940,
  limit: FREE_LIMIT,
  limitHit: false,
  feed: [ok(10), ok(10), ok(10), ok(10)],
  checkout: false,
  cardText: "",
  cardFocus: false,
  paying: false,
  toast: false,
  clicking: false,
  press: "",
};
const FINAL: Scene = {
  ...START,
  plan: "pro",
  used: 1050,
  limit: PRO_LIMIT,
  feed: [ok(10), ok(10), ok(10), ok(10), ok(10), rejected(), rejected()],
};

export default function HeroWalkthrough() {
  const [s, setS] = useState<State>({ ...START, cx: 620, cy: 420, mode: "play", paused: false });
  const set = useCallback((patch: Partial<State> | ((prev: State) => Partial<State>)) => {
    setS((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  }, []);
  const appRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pausedRef = useRef(false);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  // The cursor aims at the centre of the real button, measured in the app's own pixels
  const moveTo = useCallback(
    (name: Target) => {
      const app = appRef.current;
      const el = app?.querySelector<HTMLElement>(`[data-lf="${name}"]`);
      if (!app || !el) return;
      const a = app.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const scale = a.width / (app.offsetWidth || a.width) || 1;
      set({
        cx: (r.left - a.left + r.width / 2) / scale,
        cy: (r.top - a.top + r.height / 2) / scale,
      });
    },
    [set],
  );

  const runLoop = useCallback(() => {
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
    const click = (ms: number, press: Scene["press"], then: () => void) => {
      at(ms, () => set({ clicking: true, press }));
      at(ms + 150, () => {
        set({ press: "" });
        then();
      });
      at(ms + 520, () => set({ clicking: false }));
    };
    const moveIdle = () => {
      const app = appRef.current;
      set({ cx: (app?.offsetWidth ?? 1072) * 0.66, cy: (app?.offsetHeight ?? 600) * 0.78 });
    };
    const push = (entry: FeedEntry, extra: Partial<Scene> = {}) =>
      set((p) => ({ ...extra, feed: [entry, ...p.feed].slice(0, 7) }));

    // One pass of the script; the last step schedules the next pass
    function loop() {
      clear();
      set({ ...START });
      at(30, moveIdle);
      // Initech's app reports usage until the Free limit holds
      for (let k = 0; k < 6; k++) {
        at(500 + k * 300, () => push(ok(10), { used: Math.min(FREE_LIMIT, 950 + k * 10) }));
      }
      at(2400, () => push(rejected(), { limitHit: true }));
      at(2800, () => push(rejected()));
      // Upgrade
      at(3100, () => moveTo("upgrade"));
      click(4050, "upgrade", () => set({ scene: "billing" }));
      at(4700, () => moveTo("choose"));
      click(5650, "choose", () => set({ checkout: true }));
      at(6250, () => moveTo("card"));
      click(7150, "card", () => set({ cardFocus: true }));
      for (let i = 1; i <= CARD.length; i++) {
        at(7350 + i * 55, () => set({ cardText: CARD.slice(0, i) }));
      }
      at(8650, () => set({ cardFocus: false }));
      at(8700, () => moveTo("pay"));
      click(9650, "pay", () => set({ paying: true }));
      // Stripe confirms; the webhook flips the plan and usage flows again
      at(10900, () =>
        set({
          checkout: false,
          paying: false,
          cardText: "",
          scene: "dash",
          plan: "pro",
          limit: PRO_LIMIT,
          limitHit: false,
          toast: true,
        }),
      );
      at(11000, moveIdle);
      for (let k = 0; k < 5; k++) {
        at(11500 + k * 380, () => push(ok(10), { used: 1010 + k * 10 }));
      }
      at(14200, () => set({ toast: false }));
      at(16600, loop);
    }
    loop();
  }, [clear, moveTo, set]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time switch to the still frame
      set({ ...FINAL, mode: "static" });
      return;
    }
    // Runs only while on screen: no timers or re-renders once the visitor scrolls past it
    const app = appRef.current;
    if (!app || typeof IntersectionObserver === "undefined") {
      runLoop();
      return clear;
    }
    const seen = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) clear();
      else if (!pausedRef.current) runLoop();
    });
    seen.observe(app);
    return () => {
      seen.disconnect();
      clear();
    };
  }, [clear, runLoop, set]);

  const togglePause = () => {
    pausedRef.current = !s.paused;
    if (s.paused) {
      set({ paused: false });
      runLoop();
    } else {
      clear();
      set({ ...FINAL, paused: true, clicking: false, press: "" });
    }
  };

  const playing = s.mode === "play";

  return (
    <GlowFrame wide>
      <div className="@container relative overflow-hidden rounded-[16px] border border-frame bg-white shadow-[0_30px_80px_-30px_rgba(11,18,21,0.35)]">
        <div
          role="img"
          aria-label="Animated walkthrough of LedgerFlow: a Free workspace reports usage through the API until it hits its limit, upgrades to Pro with a test card, and usage flows again once Stripe confirms the payment"
        >
          <div
            aria-hidden
            className="text-left text-[calc(100cqw/67)] leading-tight select-none"
          >
            <BrowserBar scene={s.scene} />
            <div
              ref={appRef}
              data-lf="app"
              className="relative flex h-[37.4em] overflow-hidden bg-white"
            >
              <Sidebar scene={s.scene} />
              <div className="flex min-w-0 flex-1 flex-col gap-[1.1em] px-[2em] py-[1.75em]">
                <PageHeader scene={s.scene} pro={s.plan === "pro"} />
                {s.scene === "dash" ? <Dashboard s={s} /> : <Billing press={s.press} />}
              </div>
              {s.checkout && <Checkout s={s} />}
              {s.toast && <Toast />}
              {playing && <Cursor x={s.cx} y={s.cy} clicking={s.clicking} pressed={!!s.press} />}
            </div>
          </div>
        </div>
        {playing && (
          <button
            type="button"
            onClick={togglePause}
            aria-pressed={s.paused}
            className="absolute bottom-3 left-3 inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border border-line-strong bg-white/92 px-3 py-1 text-[12.5px] text-ink-soft"
          >
            {s.paused ? "Play animation" : "Pause animation"}
          </button>
        )}
      </div>
    </GlowFrame>
  );
}

// Typical text sizes inside the mock (relative to its em)
const label = "text-[0.72em] leading-none text-subtle";
const note = "text-[0.68em] leading-none text-subtle";
const card = "flex flex-col rounded-[0.8em] border border-line px-[1.2em] py-[1.1em]";

function BrowserBar({ scene }: { scene: Scene["scene"] }) {
  return (
    <div className="flex h-[2.6em] items-center gap-[0.5em] border-b border-divider bg-surface px-[1em]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-[0.7em] rounded-full bg-[#E2E8E6]" />
      ))}
      <span className="ml-[0.8em] inline-flex h-[1.6em] items-center rounded-[0.45em] border border-line bg-white px-[0.8em]">
        <span className="font-mono text-[0.7em] leading-none text-subtle">
          ledgerflow-web-portal.vercel.app/demo-initech/{scene === "dash" ? "dashboard" : "billing"}
        </span>
      </span>
    </div>
  );
}

const NAV: { label: string; scene?: Scene["scene"]; heading?: boolean }[] = [
  { label: "Dashboard", scene: "dash" },
  { label: "Usage" },
  { label: "Billing", scene: "billing" },
  { label: "Settings", heading: true },
  { label: "Members" },
  { label: "API keys" },
  { label: "Audit log" },
];

function Sidebar({ scene }: { scene: Scene["scene"] }) {
  return (
    <div className="flex w-[13em] flex-none flex-col border-r border-line bg-surface px-[0.75em] py-[1em]">
      <div className="flex h-[3.5em] items-center gap-[0.6em] px-[0.5em]">
        <span className="inline-flex size-[2em] flex-none items-center justify-center rounded-[0.5em] bg-ink">
          <span className="text-[0.68em] leading-none font-semibold text-white">IN</span>
        </span>
        <span className="flex flex-col gap-[0.2em]">
          <span className="text-[0.8em] leading-none font-semibold">Initech</span>
          <span className="text-[0.66em] leading-none text-subtle">owner</span>
        </span>
      </div>
      {NAV.map((n) =>
        n.heading ? (
          <div key={n.label} className="flex h-[2.2em] items-end px-[0.7em] pb-[0.4em]">
            <span className="text-[0.64em] leading-none text-subtle">{n.label}</span>
          </div>
        ) : (
          <div
            key={n.label}
            className={cn(
              "flex h-[2.2em] items-center rounded-[0.5em] px-[0.7em] transition-[background-color] duration-250",
              n.scene === scene && "bg-[#E3E9E7] font-semibold",
            )}
          >
            <span className="text-[0.78em] leading-none">{n.label}</span>
          </div>
        ),
      )}
      <div className="mt-auto flex items-center gap-[0.6em] px-[0.5em]">
        <span className="inline-flex size-[1.9em] flex-none items-center justify-center rounded-[0.45em] bg-[#E9EEEC]">
          <span className="text-[0.68em] leading-none">P</span>
        </span>
        <span className="flex min-w-0 flex-col gap-[0.25em]">
          <span className="text-[0.72em] leading-none font-semibold">Priya Singh</span>
          <span className="text-[0.6em] leading-none text-subtle">priya.singh@initech.example</span>
        </span>
      </div>
    </div>
  );
}

function PageHeader({ scene, pro }: { scene: Scene["scene"]; pro: boolean }) {
  return (
    <div className="flex min-h-[2.6em] items-center justify-between gap-[1em]">
      <div className="flex flex-col gap-[0.4em]">
        <span className="text-[1.4em] leading-none font-[650] tracking-[-0.02em]">
          {scene === "dash" ? "Dashboard" : "Billing"}
        </span>
        <span className="text-[0.74em] leading-none text-subtle">Initech</span>
      </div>
      <span
        className={cn(
          "inline-flex h-[1.9em] items-center gap-[0.45em] rounded-full px-[0.85em] transition-[background-color] duration-300",
          pro ? "bg-primary/12" : "bg-line-soft",
        )}
      >
        <span className={cn("size-[0.45em] rounded-full", pro ? "bg-primary" : "bg-[#8C9B97]")} />
        <span
          className={cn(
            "text-[0.68em] leading-none font-semibold tracking-[0.04em]",
            pro ? "text-brand-deep" : "text-[#3F4B52]",
          )}
        >
          {pro ? "PRO · ACTIVE" : "FREE"}
        </span>
      </span>
    </div>
  );
}

function Dashboard({ s }: { s: State }) {
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

// The API requests coming in; older lines fade out
function EventFeed({ feed }: { feed: FeedEntry[] }) {
  return (
    <div className="flex min-h-0 flex-col gap-[0.7em] overflow-hidden rounded-[0.8em] bg-ink px-[1.1em] py-[1em]">
      <div className="flex items-center justify-between gap-[0.6em] pb-[0.2em]">
        <span className="inline-flex items-center gap-[0.5em]">
          <span className="size-[0.45em] animate-live rounded-full bg-mint" />
          <span className="font-mono text-[0.66em] leading-none tracking-[0.06em] text-sage">
            LIVE API EVENTS
          </span>
        </span>
        <span className="font-mono text-[0.62em] leading-none text-moss">POST /api/v1/usage</span>
      </div>
      {feed.map((e, i) => (
        <div
          key={i}
          style={{ opacity: Math.max(0.35, 1 - i * 0.11) }}
          className="grid grid-cols-[3.1em_minmax(0,1fr)_2.4em] items-center gap-[0.6em]"
        >
          <span
            className={cn(
              "inline-flex h-[1.55em] items-center justify-center rounded-[0.35em]",
              e.code === "429" ? "bg-[#E8B04B]/16" : "bg-mint/14",
            )}
          >
            <span
              className={cn(
                "font-mono text-[0.64em] leading-none font-semibold",
                e.code === "429" ? "text-[#E8B04B]" : "text-mint",
              )}
            >
              {e.code}
            </span>
          </span>
          <span className="overflow-hidden font-mono text-[0.66em] leading-none text-ellipsis whitespace-nowrap text-fog">
            {e.text}
          </span>
          <span className="text-right font-mono text-[0.6em] leading-none text-moss">
            {i === 0 ? "now" : i * 2 + "s"}
          </span>
        </div>
      ))}
    </div>
  );
}

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

function Billing({ press }: { press: Scene["press"] }) {
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

const field = "flex h-[2.4em] items-center rounded-[0.55em] px-[0.8em]";
const fieldLabel = "text-[0.66em] leading-none font-semibold";
const fieldText = "font-mono text-[0.76em] leading-none";

function Checkout({ s }: { s: State }) {
  return (
    <div className="absolute inset-0 z-3 flex animate-fade items-center justify-center bg-ink/32">
      <div className="flex w-[24em] animate-pop flex-col gap-[1em] rounded-[1em] bg-white p-[1.4em] shadow-[0_1.6em_3.2em_-1.2em_rgba(11,18,21,0.5)]">
        <div className="flex items-center justify-between gap-[1em]">
          <span className="text-[1em] leading-none font-[650]">Upgrade to Pro</span>
          <span className="inline-flex h-[1.6em] items-center rounded-[0.4em] bg-[#FEF3C7] px-[0.6em]">
            <span className="font-mono text-[0.58em] leading-none font-semibold text-[#8A3F06]">
              TEST MODE
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between border-y border-line-soft py-[0.85em]">
          <span className="text-[0.76em] leading-none">Pro · monthly</span>
          <span className="text-[0.76em] leading-none font-semibold tabular-nums">$49.00</span>
        </div>
        <div className="flex flex-col gap-[0.5em]">
          <span className={fieldLabel}>Card number</span>
          <span
            data-lf="card"
            className={cn(
              field,
              "border transition-[border-color,box-shadow] duration-200",
              s.cardFocus
                ? "border-primary shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_18%,transparent)]"
                : "border-line-strong",
            )}
          >
            <span
              className={cn(
                fieldText,
                "tracking-[0.04em]",
                s.cardText ? "text-ink" : "text-[#9AA8A4]",
              )}
            >
              {s.cardText || "1234 1234 1234 1234"}
            </span>
            {s.cardFocus && <span className="ml-0.5 h-[1.1em] w-px animate-caret bg-ink" />}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-[0.8em]">
          {[
            ["Expiry", "12 / 30"],
            ["CVC", "123"],
          ].map(([name, value]) => (
            <span key={name} className="flex flex-col gap-[0.5em]">
              <span className={fieldLabel}>{name}</span>
              <span className={cn(field, "border border-line-strong")}>
                <span className={fieldText}>{value}</span>
              </span>
            </span>
          ))}
        </div>
        <span
          data-lf="pay"
          className={cn(
            "flex h-[2.6em] items-center justify-center gap-[0.55em] rounded-[0.6em] transition-[background-color] duration-150",
            s.press === "pay" ? "bg-black" : "bg-ink",
          )}
        >
          {s.paying && (
            <span className="size-[0.9em] animate-spin-fast rounded-full border-2 border-white/35 border-t-white" />
          )}
          <span className="text-[0.76em] leading-none font-medium text-white">
            {s.paying ? "Processing…" : "Pay $49.00"}
          </span>
        </span>
      </div>
    </div>
  );
}

function Toast() {
  return (
    <div className="absolute right-[1.4em] bottom-[1.4em] z-4 flex animate-toast items-center gap-[0.75em] rounded-[0.8em] border border-line bg-white py-[0.85em] pr-[1.1em] pl-[0.9em] shadow-[0_1em_2.4em_-1em_rgba(11,18,21,0.38)]">
      <span className="inline-flex size-[1.6em] flex-none items-center justify-center rounded-full bg-primary">
        <svg
          width="0.9em"
          height="0.9em"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>
      <span className="flex flex-col gap-[0.35em]">
        <span className="text-[0.76em] leading-none font-semibold">Payment confirmed</span>
        <span className="text-[0.66em] leading-none text-subtle">
          Webhook processed · Pro is active
        </span>
      </span>
    </div>
  );
}

// The scripted pointer: it glides between buttons, presses in on click and ripples
function Cursor({
  x,
  y,
  clicking,
  pressed,
}: {
  x: number;
  y: number;
  clicking: boolean;
  pressed: boolean;
}) {
  return (
    <div
      style={{ transform: `translate(${Math.round(x)}px, ${Math.round(y)}px)` }}
      className="pointer-events-none absolute top-0 left-0 z-6 transition-transform duration-950 ease-[cubic-bezier(0.22,1,0.36,1)]"
    >
      {clicking && (
        <span className="absolute top-[-1.3em] left-[-1.3em] size-[2.6em] animate-click rounded-full bg-primary/28" />
      )}
      <div
        className={cn(
          "relative origin-top-left transition-transform duration-140 ease-[ease]",
          pressed && "scale-86",
        )}
      >
        <svg
          width="1.3em"
          height="1.3em"
          viewBox="0 0 20 20"
          className="block drop-shadow-[0_0.12em_0.22em_rgba(11,18,21,0.35)]"
        >
          <path
            d="M3 2.2l13.6 5.7c.8.3.7 1.4-.1 1.6l-5.6 1.5-2.3 5.4c-.3.8-1.4.7-1.6-.1L2.2 3.1c-.2-.6.3-1.1.8-.9z"
            fill="var(--color-primary)"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <span className="absolute top-[1.15em] left-[1.15em] inline-flex h-[1.55em] items-center rounded-full bg-primary px-[0.6em] whitespace-nowrap shadow-[0_0.35em_0.9em_-0.35em_rgba(11,18,21,0.45)]">
          <span className="text-[0.64em] leading-none font-semibold text-white">Owner</span>
        </span>
      </div>
    </div>
  );
}
