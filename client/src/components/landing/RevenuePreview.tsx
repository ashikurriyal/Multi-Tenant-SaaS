"use client";

import { Fragment, useState } from "react";
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

// A coded replica of the platform admin's Revenue page. Switching the range remounts the
// body (key={range}), so the stat cards, line and bars replay their intro animations.
export default function RevenuePreview() {
  const [range, setRange] = useState<Range>(12);

  return (
    <figure className="rv rev-fig" data-lf="revfig">
      <div className="glow" style={{ borderRadius: 16, padding: 1 }}>
        <span className="glow-ring" aria-hidden="true">
          <span />
        </span>
        <div className="rev-frame">
          <div className="rev-bar" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>ledgerflow-web-portal.vercel.app/admin?months={range}</span>
          </div>
          <div className="rev-body">
            <div className="rev-head">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="rev-title">Revenue</span>
                <span className="rev-sub">Across all organizations, from daily MRR snapshots</span>
              </div>
              <div className="rng-seg" role="group" aria-label="Range">
                <span
                  className="rng-thumb"
                  aria-hidden="true"
                  style={{ transform: `translateX(${RANGES.indexOf(range) * 64}px)` }}
                />
                {RANGES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    aria-pressed={range === r}
                    style={{ color: range === r ? "#FFFFFF" : "#5B676E" }}
                  >
                    {r} mo
                  </button>
                ))}
              </div>
            </div>
            <RangeBody key={range} n={range} />
          </div>
        </div>
      </div>
      <figcaption className="rev-caption">
        Try the range switch: sample data shaped like the demo platform.
      </figcaption>
    </figure>
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="rev-kpis">
        {kpis.map((k, i) => (
          <div key={k.label} className="rev-kpi rng-in" style={{ animationDelay: `${i * 60}ms` }}>
            <span className="rev-kpi-label">{k.label}</span>
            <span className="rev-kpi-value">{k.value}</span>
            <span className="rev-kpi-foot" style={{ color: k.up ? "#0A6152" : "#5B676E" }}>
              {k.foot}
            </span>
          </div>
        ))}
      </div>
      <div className="rev-strip rng-in" style={{ animationDelay: "220ms" }}>
        <span style={{ fontWeight: 600 }}>Last {n} months</span>
        <span>
          MRR {money(sum.start)} → {money(CURRENT_MRR)}
          {sum.growPct && (
            <span style={{ color: "#0A6152", fontWeight: 600 }}> ({sum.growPct})</span>
          )}
        </span>
        <span>
          Gained <b style={{ fontWeight: 600, color: "#0A6152" }}>+{money(sum.gained)}</b>
        </span>
        <span>
          Lost <b style={{ fontWeight: 600, color: "#B42C22" }}>−{money(sum.lost)}</b>
        </span>
      </div>
      <div className="rev-card rng-in" style={{ animationDelay: "120ms" }}>
        <div className="rev-card-head">
          <span>MRR</span>
          <span>Month-end values · {n} months</span>
        </div>
        <MrrChart n={n} />
      </div>
      <div className="rev-card rng-in" style={{ animationDelay: "200ms", paddingBottom: 12 }}>
        <div className="rev-card-head">
          <span>MRR movements</span>
          <span>Gains above zero, losses below</span>
        </div>
        <MovementsChart n={n} />
        <div className="mv-legend">
          {SERIES.map((s) => (
            <span key={s.key} className="mv-key">
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 3,
                  background: `linear-gradient(180deg, ${s.light}, ${s.color})`,
                }}
              />
              {s.label}
            </span>
          ))}
          <span className="mv-key">
            <svg width="18" height="9" viewBox="0 0 18 9" aria-hidden="true">
              <path d="M1 4.5h16" stroke="#0B1215" strokeWidth="1.6" />
              <circle cx="9" cy="4.5" r="2.6" fill="#FFFFFF" stroke="#0B1215" strokeWidth="1.6" />
            </svg>
            Net new
          </span>
        </div>
      </div>
    </div>
  );
}

function MrrChart({ n }: { n: Range }) {
  const c = mrrChart(n);
  const id = `lf-area-${n}`;
  return (
    <svg className="rev-chart" viewBox="0 0 600 190" role="img" aria-label={c.aria}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--lf-accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--lf-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {c.grid.map((g) => (
        <Fragment key={g.y}>
          <line x1={c.bounds.L} x2={c.bounds.R} y1={g.y} y2={g.y} />
          <text x={c.bounds.L - 8} y={g.y + 3.5} textAnchor="end">
            {g.label}
          </text>
        </Fragment>
      ))}
      {c.xLabels.map((l) => (
        <text key={l.x} x={l.x} y={c.bounds.B + 18} textAnchor="middle">
          {l.label}
        </text>
      ))}
      <path className="rev-area" d={c.area} fill={`url(#${id})`} stroke="none" />
      <path
        className="rev-line"
        pathLength={1}
        d={c.line}
        fill="none"
        stroke="var(--lf-accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        className="rev-dot"
        cx={c.last[0]}
        cy={c.last[1]}
        r="4.5"
        fill="#FFFFFF"
        stroke="var(--lf-accent)"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function MovementsChart({ n }: { n: Range }) {
  const c = movementsChart(n);
  const grad = (key: string) => `url(#lf-g-${key}-${n})`;
  return (
    <svg
      className="mv-chart"
      viewBox="0 0 600 232"
      role="img"
      aria-label={`MRR movements over the last ${n} months: gains above zero, losses below, with a line for net new MRR`}
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
            className={g.zero ? "zero" : "grid"}
            x1={c.bounds.L}
            x2={c.bounds.R}
            y1={g.y}
            y2={g.y}
          />
          <text className="ax" x={c.bounds.L - 8} y={g.y + 3.5} textAnchor="end">
            {g.label}
          </text>
        </Fragment>
      ))}
      {c.cols.map((col) => (
        <g key={col.cx} className="mv-col">
          <title>{col.title}</title>
          <rect
            className="mv-band"
            x={col.band.x}
            y={c.bounds.T - 4}
            width={col.band.w}
            height={c.bounds.B - c.bounds.T + 8}
            rx={col.band.rx}
          />
          <g className="mv-up" style={{ animationDelay: `${Math.round(col.delay)}ms` }}>
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
          <g className="mv-dn" style={{ animationDelay: `${Math.round(col.delay + 140)}ms` }}>
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
            <text className="ax" x={col.cx} y={c.bounds.B + 20} textAnchor="middle">
              {col.label}
            </text>
          )}
          <g className="mv-tip" aria-hidden="true">
            <rect x={col.tipX} y="0" width={col.tipW} height="24" rx="7" fill="#0B1215" />
            <text x={col.tipX + 10} y="15.5" fill="#8FA19C" style={{ fontSize: 10 }}>
              {col.month}
            </text>
            <text
              x={col.tipX + col.tipW - 10}
              y="15.5"
              textAnchor="end"
              fill="#FFFFFF"
              style={{ fontSize: 10.5, fontWeight: 600 }}
            >
              {col.netText}
            </text>
          </g>
        </g>
      ))}
      <g style={{ pointerEvents: "none" }}>
        <path
          className="mv-net"
          pathLength={1}
          d={c.netPath}
          fill="none"
          stroke="#0B1215"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.85"
        />
        {c.cols.map((col) => (
          <circle
            key={col.cx}
            className="mv-netdot"
            cx={col.cx}
            cy={col.netY}
            r={c.dotR}
            fill="#FFFFFF"
            stroke="#0B1215"
            strokeWidth="1.6"
          />
        ))}
      </g>
    </svg>
  );
}
