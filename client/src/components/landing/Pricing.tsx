"use client";

import Link from "next/link";
import { useState } from "react";

// Pricing: the three seeded plans (server/prisma/seed.ts) and an estimator that prices a
// month's usage on each and highlights the cheapest. Monthly plans only.

// prettier-ignore
const UNIT_STOPS = [500, 1000, 5000, 10000, 25000, 50000, 75000, 100000, 125000, 150000, 250000, 500000, 750000, 1000000];
type PlanKey = "free" | "pro" | "biz";

const usd = (v: number) =>
  "$" +
  (Number.isInteger(v)
    ? v.toLocaleString("en-US")
    : v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

// Free stops at its limit (429), so it has no price above 1,000 units
const planCosts = (u: number): Record<PlanKey, number | null> => ({
  free: u <= 1000 ? 0 : null,
  pro: 49 + Math.max(0, u - 50000) * 0.002,
  biz: 199 + Math.max(0, u - 500000) * 0.001,
});

export default function Pricing() {
  const [unitsIdx, setUnitsIdx] = useState(7);
  const units = UNIT_STOPS[unitsIdx];
  const costs = planCosts(units);
  const best = (Object.entries(costs) as [PlanKey, number | null][])
    .filter((e): e is [PlanKey, number] => e[1] !== null)
    .reduce((a, b) => (b[1] < a[1] ? b : a))[0];

  const est = (k: PlanKey) => {
    const c = costs[k];
    return c === null ? "Over the limit" : `${usd(c)} / mo`;
  };
  const estColor = (k: PlanKey) =>
    costs[k] === null ? "#B42C22" : k === best ? "#0A6152" : "#0B1215";

  const unitsMax = UNIT_STOPS.length - 1;
  const unitsPct = Math.round((unitsIdx / unitsMax) * 1000) / 10;
  const unitsText = units.toLocaleString("en-US");
  const onUnits = (e: React.ChangeEvent<HTMLInputElement>) => setUnitsIdx(Number(e.target.value));
  const est_free = est("free");
  const est_pro = est("pro");
  const est_biz = est("biz");
  const estColor_free = estColor("free");
  const estColor_pro = estColor("pro");
  const estColor_biz = estColor("biz");
  const best_free = String(best === "free");
  const best_pro = String(best === "pro");
  const best_biz = String(best === "biz");

  return (
    <>
      <section
        id="pricing"
        style={{
          position: "relative",
          overflow: "hidden",
          isolation: "isolate",
          background: "#F7F9F8",
          borderTop: "1px solid #E8EDEB",
          borderBottom: "1px solid #E8EDEB",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            zIndex: "-1",
            left: "50%",
            top: "-220px",
            width: "900px",
            height: "520px",
            marginLeft: "-450px",
            borderRadius: "999px",
            background:
              "radial-gradient(closest-side, color-mix(in srgb, var(--lf-accent) 14%, transparent), transparent)",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "96px 24px" }}>
          <div
            className="rv"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "12px",
            }}
          >
            <p
              style={{
                margin: "0",
                fontSize: "14px",
                fontWeight: "600",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--lf-accent)",
              }}
            >
              Pricing
            </p>
            <h2
              style={{
                margin: "0",
                fontSize: "clamp(30px, 3.4vw, 44px)",
                lineHeight: "1.1",
                letterSpacing: "-0.025em",
                fontWeight: "650",
              }}
            >
              Start free. Pay for what you use.
            </h2>
            <p
              style={{
                margin: "0",
                maxWidth: "620px",
                fontSize: "17px",
                lineHeight: "1.6",
                color: "#46535A",
              }}
            >
              Monthly plans with included units. Paid plans keep working past the included amount
              and bill the extra through Stripe.
            </p>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "4px",
                height: "32px",
                padding: "0 12px",
                borderRadius: "999px",
                background: "#FFFFFF",
                border: "1px solid #E3E8E6",
                fontSize: "13.5px",
                color: "#2F3B42",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#8A3F06",
                  background: "#FEF3C7",
                  borderRadius: "5px",
                  padding: "2px 6px",
                }}
              >
                TEST MODE
              </span>
              Pay with card{" "}
              <span style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}>
                4242 4242 4242 4242
              </span>
            </span>
          </div>
          <div className="rv pr-calc">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px 20px",
              }}
            >
              <label
                htmlFor="lf-units"
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <span style={{ fontSize: "15px", fontWeight: "600" }}>Estimate your bill</span>
                <span style={{ fontSize: "13.5px", color: "#5B676E" }}>
                  Drag to set how many units you report a month
                </span>
              </label>
              <span className="pr-units">
                <b>{unitsText}</b> units / month
              </span>
            </div>
            <input
              id="lf-units"
              className="pr-range"
              type="range"
              min="0"
              max={unitsMax}
              step="1"
              value={unitsIdx}
              onChange={onUnits}
              aria-valuetext={`${unitsText} units a month`}
              style={{ "--p": `${unitsPct}%` }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                fontSize: "11.5px",
                color: "#7D8B87",
              }}
            >
              <span>500</span>
              <span>50K</span>
              <span>125K</span>
              <span>500K</span>
              <span>1M</span>
            </div>
          </div>
          <div className="pr-grid">
            <article className="rv pr-card" data-best={best_free}>
              <span className="pr-best" aria-hidden="true">
                Best fit for {unitsText} units
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                  <span className="pr-icon">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v8M8 12h8" />
                    </svg>
                  </span>
                  <h3 style={{ margin: "0", fontSize: "19px", fontWeight: "600" }}>Free</h3>
                </span>
              </div>
              <p style={{ margin: "0", fontSize: "14.5px", lineHeight: "1.5", color: "#5B676E" }}>
                For trying LedgerFlow and small side projects.
              </p>
              <p style={{ margin: "2px 0 0", display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "46px",
                    fontWeight: "650",
                    lineHeight: "1",
                    letterSpacing: "-0.035em",
                  }}
                >
                  $0
                </span>
                <span style={{ fontSize: "15px", color: "#5B676E" }}>/ month</span>
              </p>
              <div className="pr-est">
                <span>At {unitsText} units</span>
                <b style={{ color: estColor_free }}>{est_free}</b>
              </div>
              <Link
                className="btn-ghost"
                href="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textDecoration: "none",
                  color: "#0B1215",
                  background: "#FFFFFF",
                  border: "1px solid #D4DCDA",
                  borderRadius: "12px",
                  padding: "0 16px",
                  fontSize: "15px",
                  fontWeight: "500",
                  minHeight: "48px",
                  boxSizing: "border-box",
                }}
              >
                Start free
                <svg
                  className="btn-arrow"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <ul className="pr-list">
                <li className="">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ flex: "none", marginTop: "3px" }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>3 seats</span>
                </li>
                <li className="">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ flex: "none", marginTop: "3px" }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>1,000 units a month</span>
                </li>
                <li className="">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ flex: "none", marginTop: "3px" }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>Hard limit: new usage gets a 429</span>
                </li>
                <li className="">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ flex: "none", marginTop: "3px" }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>API keys, roles and the audit log</span>
                </li>
                <li className="pr-no">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    aria-hidden="true"
                    style={{ flex: "none", marginTop: "3px" }}
                  >
                    <path d="M6 12h12" />
                  </svg>
                  <span>No overage billing</span>
                </li>
              </ul>
            </article>
            <article className="rv pr-card pr-feat" data-best={best_pro}>
              <span className="pr-best" aria-hidden="true">
                Best fit for {unitsText} units
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                  <span className="pr-icon">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M13 2L3 14h9l-1 8 10-12h-9z" />
                    </svg>
                  </span>
                  <h3 style={{ margin: "0", fontSize: "19px", fontWeight: "600" }}>Pro</h3>
                </span>
                <span className="pr-pop">Most teams</span>
              </div>
              <p style={{ margin: "0", fontSize: "14.5px", lineHeight: "1.5", color: "#5B676E" }}>
                For growing teams with steady usage.
              </p>
              <p style={{ margin: "2px 0 0", display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "46px",
                    fontWeight: "650",
                    lineHeight: "1",
                    letterSpacing: "-0.035em",
                  }}
                >
                  $49
                </span>
                <span style={{ fontSize: "15px", color: "#5B676E" }}>/ month</span>
              </p>
              <div className="pr-est">
                <span>At {unitsText} units</span>
                <b style={{ color: estColor_pro }}>{est_pro}</b>
              </div>
              <Link
                className="btn-primary"
                href="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textDecoration: "none",
                  color: "#FFFFFF",
                  background: "var(--lf-accent)",
                  borderRadius: "12px",
                  padding: "0 16px",
                  fontSize: "15px",
                  fontWeight: "500",
                  minHeight: "48px",
                  boxSizing: "border-box",
                }}
              >
                Choose Pro
                <svg
                  className="btn-arrow"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <ul className="pr-list">
                <li className="">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ flex: "none", marginTop: "3px" }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>10 seats</span>
                </li>
                <li className="">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ flex: "none", marginTop: "3px" }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>50,000 units a month included</span>
                </li>
                <li className="">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ flex: "none", marginTop: "3px" }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>
                    <b>$0.002</b> per extra unit, billed by Stripe’s meter
                  </span>
                </li>
                <li className="">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ flex: "none", marginTop: "3px" }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>Plan changes with exact proration</span>
                </li>
                <li className="">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ flex: "none", marginTop: "3px" }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>Stripe Customer Portal for cards and invoices</span>
                </li>
              </ul>
            </article>
            <article className="rv pr-card" data-best={best_biz}>
              <span className="pr-best" aria-hidden="true">
                Best fit for {unitsText} units
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                  <span className="pr-icon">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="7" width="18" height="13" rx="2" />
                      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </span>
                  <h3 style={{ margin: "0", fontSize: "19px", fontWeight: "600" }}>Business</h3>
                </span>
              </div>
              <p style={{ margin: "0", fontSize: "14.5px", lineHeight: "1.5", color: "#5B676E" }}>
                For high-volume products and larger teams.
              </p>
              <p style={{ margin: "2px 0 0", display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "46px",
                    fontWeight: "650",
                    lineHeight: "1",
                    letterSpacing: "-0.035em",
                  }}
                >
                  $199
                </span>
                <span style={{ fontSize: "15px", color: "#5B676E" }}>/ month</span>
              </p>
              <div className="pr-est">
                <span>At {unitsText} units</span>
                <b style={{ color: estColor_biz }}>{est_biz}</b>
              </div>
              <Link
                className="btn-ghost"
                href="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textDecoration: "none",
                  color: "#0B1215",
                  background: "#FFFFFF",
                  border: "1px solid #D4DCDA",
                  borderRadius: "12px",
                  padding: "0 16px",
                  fontSize: "15px",
                  fontWeight: "500",
                  minHeight: "48px",
                  boxSizing: "border-box",
                }}
              >
                Choose Business
                <svg
                  className="btn-arrow"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <ul className="pr-list">
                <li className="">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ flex: "none", marginTop: "3px" }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>50 seats</span>
                </li>
                <li className="">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ flex: "none", marginTop: "3px" }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>500,000 units a month included</span>
                </li>
                <li className="">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ flex: "none", marginTop: "3px" }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>
                    <b>$0.001</b> per extra unit, billed by Stripe’s meter
                  </span>
                </li>
                <li className="">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ flex: "none", marginTop: "3px" }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>Everything in Pro</span>
                </li>
                <li className="">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ flex: "none", marginTop: "3px" }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>Cheapest above 125,000 units a month</span>
                </li>
              </ul>
            </article>
          </div>
          <div
            className="rv"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "8px 22px",
              marginTop: "32px",
              fontSize: "14px",
              color: "#46535A",
            }}
          >
            <span className="pr-foot">Change plans any time, prorated by Stripe</span>
            <span className="pr-foot">A 7-day grace period if a payment fails</span>
            <span className="pr-foot">Usage resets every billing period</span>
          </div>
        </div>
      </section>
    </>
  );
}
