// Sample data for the landing page's revenue preview: 24 months shaped like the demo
// platform, ending at its real MRR ($2,376 from 24 customers at $99 ARPA). Each month's
// movements add up to that month's change in MRR.

export type Range = 6 | 12 | 24;
export const RANGES: Range[] = [6, 12, 24];

const MON = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
const MONTHS = [...MON, ...MON];
const YEARS = ["24", "24", ...Array(12).fill("25"), ...Array(10).fill("26")];

// [new, expansion, reactivation, contraction, churned], Nov 2024 .. Oct 2026
// prettier-ignore
const MOVES: [number, number, number, number, number][] = [
  [49, 0, 0, 0, 0], [0, 0, 0, 0, 0], [49, 0, 0, 0, 0], [49, 0, 0, 0, 49],
  [99, 50, 0, 0, 0], [0, 0, 0, 50, 0], [0, 0, 0, 0, 49], [49, 50, 0, 0, 0],
  [0, 0, 49, 0, 49], [99, 0, 0, 50, 0], [49, 50, 0, 0, 49], [99, 0, 0, 0, 0],
  [150, 0, 0, 0, 0], [250, 0, 0, 0, 0], [45, 0, 0, 0, 0], [0, 150, 0, 0, 0],
  [350, 0, 0, 0, 50], [250, 150, 0, 150, 0], [100, 0, 0, 0, 50], [250, 150, 0, 0, 0],
  [250, 150, 0, 150, 50], [0, 150, 0, 164, 0], [300, 0, 50, 0, 50], [45, 0, 0, 150, 45],
];
const NET = MOVES.map(([n, e, r, c, ch]) => n + e + r - c - ch);
const MRR = NET.reduce<number[]>((acc, x) => [...acc, (acc.at(-1) ?? 0) + x], []);
export const CURRENT_MRR = MRR[MRR.length - 1];

// Averages over each range (sample figures; the stat cards themselves show the latest month)
const CUSTOMERS_AGO: Record<Range, number> = { 6: 16, 12: 5, 24: 0 };
const AVG_CHURN: Record<Range, string> = { 6: "4.8%", 12: "5.2%", 24: "6.1%" };
const AVG_NRR: Record<Range, string> = { 6: "101.4%", 12: "99.8%", 24: "98.9%" };

export type SeriesKey = "new" | "exp" | "react" | "contr" | "churn";
export const SERIES: { key: SeriesKey; label: string; color: string; light: string }[] = [
  {
    key: "new",
    label: "New",
    color: "var(--color-primary)",
    light: "color-mix(in srgb, var(--color-primary) 62%, #FFFFFF)",
  },
  { key: "exp", label: "Expansion", color: "#4F6BED", light: "#8EA2F7" },
  { key: "react", label: "Reactivation", color: "#9479E8", light: "#C3B4F4" },
  { key: "contr", label: "Contraction", color: "#F0A630", light: "#F7CB7E" },
  { key: "churn", label: "Churned", color: "#EC5B72", light: "#F49AA9" },
];

export const money = (v: number) => (v < 0 ? "−" : "") + "$" + Math.abs(v).toLocaleString("en-US");
const short = (v: number) => (v === 0 ? "$0" : v >= 1000 ? `$${+(v / 1000).toFixed(2)}K` : `$${v}`);

// A round axis maximum and step for `steps` gridlines
function nice(v: number, steps: number) {
  const raw = v / steps;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = [1, 2, 2.5, 5, 10].find((x) => x * mag >= raw) ?? 10;
  return { top: f * mag * steps, step: f * mag };
}

const label = (i: number, n: Range) =>
  n === 24 ? (i % 3 === 0 ? `${MONTHS[i]} ’${YEARS[i]}` : "") : MONTHS[i];

const indexes = (n: Range) => Array.from({ length: n }, (_, k) => 24 - n + k);

// Catmull-Rom through the points, drawn as cubic Béziers
function smooth(pts: [number, number][]) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const [p1, p2] = [pts[i], pts[i + 1]];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

export function mrrChart(n: Range) {
  const idx = indexes(n);
  const vals = idx.map((i) => MRR[i]);
  const { top, step } = nice(Math.max(...vals) * 1.05, 4);
  const [L, R, T, B] = [44, 592, 12, 160];
  const X = (k: number) => L + ((R - L) * k) / (n - 1);
  const Y = (v: number) => B - ((B - T) * v) / top;
  const pts = vals.map((v, k) => [X(k), Y(v)] as [number, number]);
  const d = smooth(pts);
  return {
    grid: [0, 1, 2, 3, 4].map((k) => ({ y: Y(step * k), label: short(Math.round(step * k)) })),
    xLabels: idx.map((i, k) => ({ x: X(k), label: label(i, n) })).filter((l) => l.label),
    line: d,
    area: `${d} L${R} ${B} L${L} ${B} Z`,
    last: pts[pts.length - 1],
    bounds: { L, R, B },
    aria: `MRR over the last ${n} months, from ${money(vals[0])} to ${money(vals[vals.length - 1])}`,
  };
}

export function movementsChart(n: Range) {
  const idx = indexes(n);
  const pos = Math.max(...idx.map((i) => MOVES[i][0] + MOVES[i][1] + MOVES[i][2]));
  const neg = Math.max(...idx.map((i) => MOVES[i][3] + MOVES[i][4]));
  const { step } = nice(Math.max(pos, 1) * 1.05, 3);
  const up = Math.ceil((pos * 1.02) / step);
  const dn = Math.max(1, Math.ceil((neg * 1.02) / step));
  const [hi, lo] = [up * step, -dn * step];
  const [L, R, T, B] = [40, 592, 30, 200];
  const Y = (v: number) => T + ((B - T) * (hi - v)) / (hi - lo);
  const slot = (R - L) / n;
  const bw = Math.min(slot * 0.5, 30);
  const GAP = 2;
  const rx = Math.min(3.5, bw / 3);
  const stagger = 900 / n;

  const grid = Array.from({ length: up + dn + 1 }, (_, j) => {
    const v = (j - dn) * step;
    return { y: Y(v), zero: v === 0, label: (v < 0 ? "−" : "") + short(Math.abs(Math.round(v))) };
  });

  const cols = idx.map((i, k) => {
    const [nw, e, r, c, ch] = MOVES[i];
    const cx = L + slot * k + slot / 2;
    const x = cx - bw / 2;
    let acc = 0;
    const gains = (
      [
        [nw, "new"],
        [e, "exp"],
        [r, "react"],
      ] as [number, SeriesKey][]
    )
      .filter(([v]) => v)
      .map(([v, key]) => {
        const y = Y(acc + v);
        const h = Math.max(Y(acc) - y - GAP, 2);
        acc += v;
        return { key, y, h };
      });
    acc = 0;
    const losses = (
      [
        [c, "contr"],
        [ch, "churn"],
      ] as [number, SeriesKey][]
    )
      .filter(([v]) => v)
      .map(([v, key]) => {
        const y = Y(-acc) + GAP;
        const h = Math.max(Y(-acc - v) - y, 2);
        acc += v;
        return { key, y, h };
      });
    const net = NET[i];
    const sign = net >= 0 ? "+" : "−";
    const tipW = 104;
    return {
      x,
      cx,
      gains,
      losses,
      netY: Y(net),
      band: { x: L + slot * k + 1.5, w: slot - 3, rx: Math.min(8, slot / 3) },
      label: label(i, n),
      month: `${MONTHS[i]} ’${YEARS[i]}`,
      title: `${MONTHS[i]} 20${YEARS[i]}: net ${sign}$${Math.abs(net)}`,
      netText: `${sign}$${Math.abs(net)} net`,
      tipX: Math.min(Math.max(cx - tipW / 2, L), R - tipW),
      tipW,
      delay: k * stagger,
    };
  });

  return {
    grid,
    cols,
    bw,
    rx,
    bounds: { L, R, T, B },
    netPath: "M" + cols.map((c) => `${c.cx.toFixed(1)} ${c.netY.toFixed(1)}`).join(" L"),
    dotR: n < 24 ? 3 : 2.2,
  };
}

export function rangeSummary(n: Range) {
  const start = n < 24 ? MRR[24 - n - 1] : 0;
  const idx = indexes(n);
  const grow = CURRENT_MRR - start;
  return {
    start,
    grow,
    growPct: start ? `+${Math.round((grow / start) * 100)}%` : "",
    gained: idx.reduce((s, i) => s + MOVES[i][0] + MOVES[i][1] + MOVES[i][2], 0),
    lost: idx.reduce((s, i) => s + MOVES[i][3] + MOVES[i][4], 0),
    customersGained: 24 - CUSTOMERS_AGO[n],
    avgChurn: AVG_CHURN[n],
    avgNrr: AVG_NRR[n],
  };
}
