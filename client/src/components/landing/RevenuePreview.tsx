"use client";

import { Fragment, useState } from "react";
import { cn } from "@/lib/utils";
import GlowFrame from "./GlowFrame";
import {
  CURRENT_MRR,
  RANGES,
  SERIES,
  money,
  movementsChart,
  mrrChart,
  rangeSummary,
  type Range,
} from "./revenueData";
import { reveal } from "./ui";

// A coded replica of the platform admin's Revenue page. Its intro plays once it scrolls into
// view (data-intro on the figure, set by LandingEffects); switching the range remounts the
// body (key={range}), so the stat cards, line and bars play it again.

// Each intro, hidden until the figure is in view. Written out in full so Tailwind finds them.
const INTRO = {
  rise: "motion-safe:group-data-[intro=pending]/rev:opacity-0 motion-safe:group-data-[intro=play]/rev:animate-rise",
  line: "motion-safe:group-data-[intro=pending]/rev:[stroke-dasharray:1] motion-safe:group-data-[intro=pending]/rev:[stroke-dashoffset:1] motion-safe:group-data-[intro=play]/rev:[stroke-dasharray:1] motion-safe:group-data-[intro=play]/rev:[animation:lf-draw_1.5s_cubic-bezier(0.4,0,0.2,1)_0.1s_both]",
  area: "motion-safe:group-data-[intro=pending]/rev:opacity-0 motion-safe:group-data-[intro=play]/rev:[animation:lf-fade-in_0.9s_ease_0.7s_both]",
  dot: "motion-safe:group-data-[intro=pending]/rev:opacity-0 motion-safe:group-data-[intro=play]/rev:[animation:lf-fade-in_0.3s_ease_1.5s_both,lf-dot-pulse_2.2s_ease-in-out_1.9s_infinite]",
  bars: "motion-safe:group-data-[intro=pending]/rev:[transform:scaleY(0)] motion-safe:group-data-[intro=play]/rev:[animation:lf-grow_0.65s_cubic-bezier(0.2,0.7,0.2,1)_both]",
  net: "motion-safe:group-data-[intro=pending]/rev:[stroke-dasharray:1] motion-safe:group-data-[intro=pending]/rev:[stroke-dashoffset:1] motion-safe:group-data-[intro=play]/rev:[stroke-dasharray:1] motion-safe:group-data-[intro=play]/rev:[animation:lf-draw_1.1s_cubic-bezier(0.4,0,0.2,1)_0.9s_both]",
  netDot:
    "motion-safe:group-data-[intro=pending]/rev:opacity-0 motion-safe:group-data-[intro=play]/rev:[animation:lf-fade-in_0.3s_ease_1.8s_both]",
};

export default function RevenuePreview() {
  const [range, setRange] = useState<Range>(12);

  return (
    <figure
      data-lf="revfig"
      className={cn(reveal, "group/rev relative m-0 min-w-0 flex-[1.4_1_540px]")}
    >
      <GlowFrame>
        <div className="overflow-hidden rounded-[16px] border border-frame bg-white shadow-[0_30px_70px_-32px_rgba(11,18,21,0.35)]">
          <div
            aria-hidden
            className="flex h-9.5 items-center gap-1.75 border-b border-divider bg-surface px-3.5"
          >
            {[0, 1, 2].map((i) => (
              <i key={i} className="size-2.5 rounded-full bg-[#e2e8e6]" />
            ))}
            <span className="ml-2.5 inline-flex h-6 items-center rounded-[7px] border border-line bg-white px-2.5 font-mono text-[11px] text-subtle">
              ledgerflow-web-portal.vercel.app/admin?months={range}
            </span>
          </div>
          <div className="flex flex-col gap-4 px-5.5 pt-5.5 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[20px] leading-none font-[650] tracking-[-0.02em]">
                  Revenue
                </span>
                <span className="text-[12.5px] leading-[1.3] text-subtle">
                  Across all organizations, from daily MRR snapshots
                </span>
              </div>
              <RangeSwitch value={range} onChange={setRange} />
            </div>
            <RangeBody key={range} n={range} />
          </div>
        </div>
      </GlowFrame>
      <figcaption className="mt-2.5 text-center text-[12.5px] text-subtle">
        Try the range switch: sample data shaped like the demo platform.
      </figcaption>
    </figure>
  );
}

// 6 / 12 / 24 months, with a dark highlight that slides to the chosen option
function RangeSwitch({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div
      role="group"
      aria-label="Range"
      className="relative inline-grid grid-cols-[repeat(3,64px)] rounded-[11px] border border-line bg-[#f2f5f4] p-0.75"
    >
      <span
        aria-hidden
        style={{ transform: `translateX(${RANGES.indexOf(value) * 64}px)` }}
        className="absolute top-0.75 left-0.75 h-7.5 w-16 rounded-[8px] bg-ink shadow-[0_4px_10px_-4px_rgba(11,18,21,0.45)] transition-transform duration-380 ease-[cubic-bezier(0.3,1.25,0.4,1)]"
      />
      {RANGES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          aria-pressed={value === r}
          className={cn(
            "relative z-10 h-7.5 cursor-pointer rounded-[8px] text-[12.5px] font-medium transition-colors duration-250 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
            value === r ? "text-white" : "text-subtle hover:text-ink",
          )}
        >
          {r} mo
        </button>
      ))}
    </div>
  );
}

function RangeBody({ n }: { n: Range }) {
  const sum = rangeSummary(n);
  const ago = `vs ${n} months ago`;
  const kpis = [
    { label: "MRR", value: money(CURRENT_MRR), foot: `+${money(sum.grow)} ${ago}`, up: true },
    {
      label: "Paying customers",
      value: "24",
      foot: `+${sum.customersGained} ${ago} · ARPA $99`,
      up: true,
    },
    { label: "Customer churn", value: "5.9%", foot: `Sep · avg ${sum.avgChurn} over ${n} mo` },
    {
      label: "Net revenue retention",
      value: "97.6%",
      foot: `Sep · avg ${sum.avgNrr} over ${n} mo`,
    },
  ];
  const card = cn(INTRO.rise, "rounded-[12px] border border-line px-3.5 pt-3.5 pb-2");

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(118px,1fr))] gap-2.5">
        {kpis.map((k, i) => (
          <div
            key={k.label}
            style={{ animationDelay: `${i * 60}ms` }}
            className={cn(
              INTRO.rise,
              "flex min-w-0 flex-col gap-2 rounded-[12px] border border-line bg-white px-3.5 pt-3.5 pb-3.25 transition-[border-color,box-shadow] duration-250",
              "hover:border-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-line))] hover:shadow-[0_8px_20px_-14px_color-mix(in_srgb,var(--color-primary)_70%,transparent)]",
            )}
          >
            <span className="text-[12px] leading-[1.2] text-subtle">{k.label}</span>
            <span className="text-[22px] leading-none font-[650] tracking-[-0.02em] tabular-nums">
              {k.value}
            </span>
            <span
              className={cn(
                "text-[11.5px] leading-[1.3]",
                k.up ? "text-brand-deep" : "text-subtle",
              )}
            >
              {k.foot}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{ animationDelay: "220ms" }}
        className={cn(
          INTRO.rise,
          "flex flex-wrap items-center gap-x-4.5 gap-y-2 rounded-[10px] border border-[color-mix(in_srgb,var(--color-primary)_18%,var(--color-line))] bg-primary/6 px-3.5 py-2.5 text-[12px] text-ink-soft",
        )}
      >
        <span className="font-semibold">Last {n} months</span>
        <span>
          MRR {money(sum.start)} → {money(CURRENT_MRR)}
          {sum.growPct && <span className="font-semibold text-brand-deep"> ({sum.growPct})</span>}
        </span>
        <span>
          Gained <b className="font-semibold text-brand-deep">+{money(sum.gained)}</b>
        </span>
        <span>
          Lost <b className="font-semibold text-[#B42C22]">−{money(sum.lost)}</b>
        </span>
      </div>
      <div style={{ animationDelay: "120ms" }} className={card}>
        <CardHead title="MRR" note={`Month-end values · ${n} months`} />
        <MrrChart n={n} />
      </div>
      <div style={{ animationDelay: "200ms" }} className={cn(card, "pb-3")}>
        <CardHead title="MRR movements" note="Gains above zero, losses below" />
        <MovementsChart n={n} />
        <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
          {SERIES.map((s) => (
            <LegendKey key={s.key}>
              <span
                className="size-2.25 rounded-[3px]"
                style={{ background: `linear-gradient(180deg, ${s.light}, ${s.color})` }}
              />
              {s.label}
            </LegendKey>
          ))}
          <LegendKey>
            <svg width="18" height="9" viewBox="0 0 18 9" aria-hidden>
              <path d="M1 4.5h16" stroke="#0B1215" strokeWidth="1.6" />
              <circle cx="9" cy="4.5" r="2.6" fill="#FFFFFF" stroke="#0B1215" strokeWidth="1.6" />
            </svg>
            Net new
          </LegendKey>
        </div>
      </div>
    </div>
  );
}

function CardHead({ title, note }: { title: string; note: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2.5">
      <span className="text-[13.5px] font-semibold">{title}</span>
      <span className="text-[11.5px] text-subtle">{note}</span>
    </div>
  );
}

function LegendKey({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-line-soft bg-surface px-2.5 text-[11.5px] text-body">
      {children}
    </span>
  );
}

// Shared SVG text and gridline styles
const axisText = "fill-faint text-[10px]";
const gridLine = "stroke-[#e6ecea] [stroke-dasharray:3_4]";

function MrrChart({ n }: { n: Range }) {
  const c = mrrChart(n);
  const id = `lf-area-${n}`;
  return (
    <svg
      viewBox="0 0 600 190"
      role="img"
      aria-label={c.aria}
      className="block h-auto w-full font-sans"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {c.grid.map((g) => (
        <Fragment key={g.y}>
          <line x1={c.bounds.L} x2={c.bounds.R} y1={g.y} y2={g.y} className={gridLine} />
          <text x={c.bounds.L - 8} y={g.y + 3.5} textAnchor="end" className={axisText}>
            {g.label}
          </text>
        </Fragment>
      ))}
      {c.xLabels.map((l) => (
        <text key={l.x} x={l.x} y={c.bounds.B + 18} textAnchor="middle" className={axisText}>
          {l.label}
        </text>
      ))}
      <path d={c.area} fill={`url(#${id})`} stroke="none" className={INTRO.area} />
      <path
        pathLength={1}
        d={c.line}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={INTRO.line}
      />
      <circle
        cx={c.last[0]}
        cy={c.last[1]}
        r="4.5"
        fill="#FFFFFF"
        stroke="var(--color-primary)"
        strokeWidth="2.4"
        className={INTRO.dot}
      />
    </svg>
  );
}

function MovementsChart({ n }: { n: Range }) {
  const c = movementsChart(n);
  const grad = (key: string) => `url(#lf-g-${key}-${n})`;
  // Hovering a month dims the others
  const bars = cn(INTRO.bars, "[transform-box:fill-box] transition-opacity duration-200");
  return (
    <svg
      viewBox="0 0 600 232"
      role="img"
      aria-label={`MRR movements over the last ${n} months: gains above zero, losses below, with a line for net new MRR`}
      className="block h-auto w-full overflow-visible font-sans text-[10.5px] [&:hover_[data-col]:not(:hover)_[data-bars]]:opacity-40"
    >
      <defs>
        {SERIES.map((s) => (
          <linearGradient key={s.key} id={`lf-g-${s.key}-${n}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.light} />
            <stop offset="100%" stopColor={s.color} />
          </linearGradient>
        ))}
      </defs>
      {c.grid.map((g) => (
        <Fragment key={g.y}>
          <line
            x1={c.bounds.L}
            x2={c.bounds.R}
            y1={g.y}
            y2={g.y}
            className={g.zero ? "stroke-[#c4cecb] stroke-[1.2]" : gridLine}
          />
          <text x={c.bounds.L - 8} y={g.y + 3.5} textAnchor="end" className={axisText}>
            {g.label}
          </text>
        </Fragment>
      ))}
      {c.cols.map((col) => (
        <g key={col.cx} data-col className="group/col cursor-default">
          <title>{col.title}</title>
          <rect
            x={col.band.x}
            y={c.bounds.T - 4}
            width={col.band.w}
            height={c.bounds.B - c.bounds.T + 8}
            rx={col.band.rx}
            className="fill-primary/7 opacity-0 transition-opacity duration-200 group-hover/col:opacity-100"
          />
          <g
            data-bars
            style={{ animationDelay: `${Math.round(col.delay)}ms` }}
            className={cn(bars, "origin-bottom")}
          >
            {col.gains.map((s) => (
              <rect
                key={s.key}
                x={col.x}
                y={s.y}
                width={c.bw}
                height={s.h}
                rx={c.rx}
                fill={grad(s.key)}
              />
            ))}
          </g>
          <g
            data-bars
            style={{ animationDelay: `${Math.round(col.delay + 140)}ms` }}
            className={cn(bars, "origin-top")}
          >
            {col.losses.map((s) => (
              <rect
                key={s.key}
                x={col.x}
                y={s.y}
                width={c.bw}
                height={s.h}
                rx={c.rx}
                fill={grad(s.key)}
              />
            ))}
          </g>
          {col.label && (
            <text x={col.cx} y={c.bounds.B + 20} textAnchor="middle" className={axisText}>
              {col.label}
            </text>
          )}
          {/* Tooltip: the month and its net movement */}
          <g
            aria-hidden
            className="pointer-events-none translate-y-1 opacity-0 transition-[opacity,translate] duration-180 group-hover/col:translate-y-0 group-hover/col:opacity-100"
          >
            <rect x={col.tipX} y="0" width={col.tipW} height="24" rx="7" fill="#0B1215" />
            <text x={col.tipX + 10} y="15.5" fill="#8FA19C" className="text-[10px]">
              {col.month}
            </text>
            <text
              x={col.tipX + col.tipW - 10}
              y="15.5"
              textAnchor="end"
              fill="#FFFFFF"
              className="text-[10.5px] font-semibold"
            >
              {col.netText}
            </text>
          </g>
        </g>
      ))}
      <g className="pointer-events-none">
        <path
          pathLength={1}
          d={c.netPath}
          fill="none"
          stroke="#0B1215"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.85"
          className={INTRO.net}
        />
        {c.cols.map((col) => (
          <circle
            key={col.cx}
            cx={col.cx}
            cy={col.netY}
            r={c.dotR}
            fill="#FFFFFF"
            stroke="#0B1215"
            strokeWidth="1.6"
            className={INTRO.netDot}
          />
        ))}
      </g>
    </svg>
  );
}
