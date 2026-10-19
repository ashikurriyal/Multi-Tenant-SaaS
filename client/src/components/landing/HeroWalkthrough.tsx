"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";

// The hero's scripted product walkthrough (about 16 s, looping): Initech's Free workspace
// reports usage until the limit holds, upgrades to Pro with a test card, and usage flows
// again once Stripe confirms. Visitors who prefer reduced motion see the final state.

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

  const dash = s.scene === "dash";
  const pro = s.plan === "pro";
  const pct = Math.min(100, Math.round((s.used / s.limit) * 1000) / 10);
  const warn = !pro && pct >= 80;
  const isDash = dash;
  const isBilling = !dash;
  const urlPath = dash ? "/demo-initech/dashboard" : "/demo-initech/billing";
  const pageTitle = dash ? "Dashboard" : "Billing";
  const navDashBg = dash ? "#E3E9E7" : "transparent";
  const navDashWeight = dash ? 600 : 400;
  const navBillingBg = dash ? "transparent" : "#E3E9E7";
  const navBillingWeight = dash ? 400 : 600;
  const planChipText = pro ? "PRO · ACTIVE" : "FREE";
  const planChipBg = pro ? "color-mix(in srgb, var(--lf-accent) 12%, #FFFFFF)" : "#EEF2F1";
  const planChipColor = pro ? "#0A6152" : "#3F4B52";
  const planChipDot = pro ? "var(--lf-accent)" : "#8C9B97";
  const limitHit = s.limitHit && dash;
  const usedText = s.used.toLocaleString("en-US");
  const limitText = s.limit.toLocaleString("en-US");
  const pctText = (pro ? Math.max(1, Math.round(pct)) : Math.round(pct)) + "%";
  const pctColor = s.limitHit ? "#B42C22" : warn ? "#8A3F06" : "#0A6152";
  const meterColor = s.limitHit ? "#C0352B" : warn ? "#D99A1E" : "var(--lf-accent)";
  const usageFoot = s.limitHit
    ? "Limit reached · new usage is rejected"
    : pro
      ? "Within the 50,000 included units"
      : Math.round(pct) + "% of the Free limit";
  const planName = pro ? "Pro" : "Free";
  const planFoot = pro
    ? "50,000 units included · $0.002 per extra unit"
    : "1,000 units a month · hard limit";
  const feed = s.feed.map((e, i) => ({
    ...e,
    time: i === 0 ? "now" : i * 2 + "s",
    opacity: Math.max(0.35, 1 - i * 0.11),
    codeBg: e.code === "429" ? "rgba(232,176,75,0.16)" : "rgba(95,211,181,0.14)",
    codeColor: e.code === "429" ? "#E8B04B" : "#5FD3B5",
  }));
  const upgradeBg = s.press === "upgrade" ? "#8E2A20" : "#C0352B";
  const chooseBg = s.press === "choose" ? "#0A6152" : "var(--lf-accent)";
  const { checkout, cardFocus, paying, toast, clicking } = s;
  const cardText = s.cardText || "1234 1234 1234 1234";
  const cardColor = s.cardText ? "#0B1215" : "#9AA8A4";
  const cardBorder = s.cardFocus ? "var(--lf-accent)" : "#D4DCDA";
  const cardRing = s.cardFocus
    ? "0 0 0 3px color-mix(in srgb, var(--lf-accent) 18%, transparent)"
    : "none";
  const payLabel = s.paying ? "Processing…" : "Pay $49.00";
  const payBg = s.press === "pay" ? "#000000" : "#0B1215";
  const showCursor = s.mode === "play";
  const cx = Math.round(s.cx);
  const cy = Math.round(s.cy);
  const cursorScale = s.press ? 0.86 : 1;
  const canPause = s.mode === "play";
  const pauseLabel = s.paused ? "Play animation" : "Pause animation";
  const pausedAria = s.paused;

  return (
    <div className="glow wide" style={{ borderRadius: "16px", padding: "1px" }}>
      <span className="glow-ring" aria-hidden="true">
        <span />
      </span>
      <div
        style={{
          position: "relative",
          borderRadius: "16px",
          overflow: "hidden",
          background: "#FFFFFF",
          border: "1px solid #DCE3E1",
          boxShadow: "0 30px 80px -30px rgba(11,18,21,0.35)",
          containerType: "inline-size",
        }}
      >
        <div
          role="img"
          aria-label="Animated walkthrough of LedgerFlow: a Free workspace reports usage through the API until it hits its limit, upgrades to Pro with a test card, and usage flows again once Stripe confirms the payment"
        >
          <div
            className="demo"
            aria-hidden="true"
            style={{
              fontSize: "calc(100cqw / 67)",
              textAlign: "left",
              userSelect: "none",
              lineHeight: "1.25",
            }}
          >
            {/* Browser bar */}
            <div
              style={{
                height: "2.6em",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: "0.5em",
                padding: "0 1em",
                borderBottom: "1px solid #E8EDEB",
                background: "#F7F9F8",
              }}
            >
              <span
                style={{
                  width: "0.7em",
                  height: "0.7em",
                  borderRadius: "999px",
                  background: "#E2E8E6",
                }}
              />
              <span
                style={{
                  width: "0.7em",
                  height: "0.7em",
                  borderRadius: "999px",
                  background: "#E2E8E6",
                }}
              />
              <span
                style={{
                  width: "0.7em",
                  height: "0.7em",
                  borderRadius: "999px",
                  background: "#E2E8E6",
                }}
              />
              <span
                style={{
                  marginLeft: "0.8em",
                  display: "inline-flex",
                  alignItems: "center",
                  height: "1.6em",
                  boxSizing: "border-box",
                  padding: "0 0.8em",
                  background: "#FFFFFF",
                  border: "1px solid #E3E8E6",
                  borderRadius: "0.45em",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                    fontSize: "0.7em",
                    lineHeight: "1",
                    color: "#5B676E",
                  }}
                >
                  ledgerflow-web-portal.vercel.app{urlPath}
                </span>
              </span>
            </div>
            {/* App */}
            <div
              ref={appRef}
              data-lf="app"
              style={{
                position: "relative",
                height: "37.4em",
                overflow: "hidden",
                background: "#FFFFFF",
                display: "flex",
              }}
            >
              {/* Sidebar */}
              <div
                style={{
                  flex: "none",
                  width: "13em",
                  boxSizing: "border-box",
                  background: "#F7F9F8",
                  borderRight: "1px solid #E3E8E6",
                  padding: "1em 0.75em",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    height: "3.5em",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6em",
                    padding: "0 0.5em",
                  }}
                >
                  <span
                    style={{
                      width: "2em",
                      height: "2em",
                      flex: "none",
                      borderRadius: "0.5em",
                      background: "#0B1215",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.68em",
                        fontWeight: "600",
                        lineHeight: "1",
                        color: "#FFFFFF",
                      }}
                    >
                      IN
                    </span>
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: "0.2em" }}>
                    <span style={{ fontSize: "0.8em", fontWeight: "600", lineHeight: "1" }}>
                      Initech
                    </span>
                    <span style={{ fontSize: "0.66em", lineHeight: "1", color: "#5B676E" }}>
                      owner
                    </span>
                  </span>
                </div>
                <div
                  style={{
                    height: "2.2em",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 0.7em",
                    borderRadius: "0.5em",
                    background: navDashBg,
                    transition: "background 0.25s ease",
                  }}
                >
                  <span style={{ fontSize: "0.78em", lineHeight: "1", fontWeight: navDashWeight }}>
                    Dashboard
                  </span>
                </div>
                <div
                  style={{
                    height: "2.2em",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 0.7em",
                    borderRadius: "0.5em",
                  }}
                >
                  <span style={{ fontSize: "0.78em", lineHeight: "1" }}>Usage</span>
                </div>
                <div
                  style={{
                    height: "2.2em",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 0.7em",
                    borderRadius: "0.5em",
                    background: navBillingBg,
                    transition: "background 0.25s ease",
                  }}
                >
                  <span
                    style={{ fontSize: "0.78em", lineHeight: "1", fontWeight: navBillingWeight }}
                  >
                    Billing
                  </span>
                </div>
                <div
                  style={{
                    height: "2.2em",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "0 0.7em 0.4em",
                    boxSizing: "border-box",
                  }}
                >
                  <span style={{ fontSize: "0.64em", lineHeight: "1", color: "#5B676E" }}>
                    Settings
                  </span>
                </div>
                <div
                  style={{
                    height: "2.2em",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 0.7em",
                    borderRadius: "0.5em",
                  }}
                >
                  <span style={{ fontSize: "0.78em", lineHeight: "1" }}>Members</span>
                </div>
                <div
                  style={{
                    height: "2.2em",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 0.7em",
                    borderRadius: "0.5em",
                  }}
                >
                  <span style={{ fontSize: "0.78em", lineHeight: "1" }}>API keys</span>
                </div>
                <div
                  style={{
                    height: "2.2em",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 0.7em",
                    borderRadius: "0.5em",
                  }}
                >
                  <span style={{ fontSize: "0.78em", lineHeight: "1" }}>Audit log</span>
                </div>
                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6em",
                    padding: "0 0.5em",
                  }}
                >
                  <span
                    style={{
                      width: "1.9em",
                      height: "1.9em",
                      flex: "none",
                      borderRadius: "0.45em",
                      background: "#E9EEEC",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: "0.68em", lineHeight: "1" }}>P</span>
                  </span>
                  <span
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25em",
                      minWidth: "0",
                    }}
                  >
                    <span style={{ fontSize: "0.72em", fontWeight: "600", lineHeight: "1" }}>
                      Priya Singh
                    </span>
                    <span style={{ fontSize: "0.6em", lineHeight: "1", color: "#5B676E" }}>
                      priya.singh@initech.example
                    </span>
                  </span>
                </div>
              </div>
              {/* Main */}
              <div
                style={{
                  flex: "1",
                  minWidth: "0",
                  boxSizing: "border-box",
                  padding: "1.75em 2em",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.1em",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1em",
                    minHeight: "2.6em",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4em" }}>
                    <span
                      style={{
                        fontSize: "1.4em",
                        fontWeight: "650",
                        lineHeight: "1",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {pageTitle}
                    </span>
                    <span style={{ fontSize: "0.74em", lineHeight: "1", color: "#5B676E" }}>
                      Initech
                    </span>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45em",
                      height: "1.9em",
                      boxSizing: "border-box",
                      padding: "0 0.85em",
                      borderRadius: "999px",
                      background: planChipBg,
                      transition: "background 0.3s ease",
                    }}
                  >
                    <span
                      style={{
                        width: "0.45em",
                        height: "0.45em",
                        borderRadius: "999px",
                        background: planChipDot,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.68em",
                        fontWeight: "600",
                        lineHeight: "1",
                        letterSpacing: "0.04em",
                        color: planChipColor,
                      }}
                    >
                      {planChipText}
                    </span>
                  </span>
                </div>
                {isDash && (
                  <>
                    <div
                      className="scene"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1em",
                        flex: "1",
                        minHeight: "0",
                      }}
                    >
                      {limitHit && (
                        <>
                          <div
                            className="pop"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.9em",
                              padding: "0.8em 0.9em 0.8em 1em",
                              border: "1px solid #F2C7BC",
                              background: "#FDF1EE",
                              borderRadius: "0.75em",
                            }}
                          >
                            <span
                              style={{
                                width: "1.7em",
                                height: "1.7em",
                                flex: "none",
                                borderRadius: "999px",
                                background: "#C0352B",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.78em",
                                  fontWeight: "700",
                                  lineHeight: "1",
                                  color: "#FFFFFF",
                                }}
                              >
                                !
                              </span>
                            </span>
                            <span
                              style={{
                                flex: "1",
                                minWidth: "0",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.35em",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.78em",
                                  fontWeight: "600",
                                  lineHeight: "1",
                                  color: "#8E2A20",
                                }}
                              >
                                Monthly usage limit reached
                              </span>
                              <span
                                style={{ fontSize: "0.68em", lineHeight: "1.2", color: "#8E2A20" }}
                              >
                                New usage is rejected until the limit resets on Nov 1.
                              </span>
                            </span>
                            <span
                              data-lf="upgrade"
                              style={{
                                flex: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "2.3em",
                                boxSizing: "border-box",
                                padding: "0 1.1em",
                                borderRadius: "0.55em",
                                background: upgradeBg,
                                transition: "background 0.15s ease",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.74em",
                                  fontWeight: "500",
                                  lineHeight: "1",
                                  color: "#FFFFFF",
                                }}
                              >
                                Upgrade plan
                              </span>
                            </span>
                          </div>
                        </>
                      )}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
                          gap: "1em",
                          flex: "1",
                          minHeight: "0",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1em",
                            minHeight: "0",
                          }}
                        >
                          <div
                            style={{
                              border: "1px solid #E3E8E6",
                              borderRadius: "0.8em",
                              padding: "1.1em 1.2em",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.8em",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{ fontSize: "0.72em", lineHeight: "1", color: "#5B676E" }}
                              >
                                Usage this period
                              </span>
                              <span
                                style={{
                                  fontSize: "0.72em",
                                  lineHeight: "1",
                                  fontWeight: "600",
                                  color: pctColor,
                                }}
                              >
                                {pctText}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "0.35em" }}>
                              <span
                                style={{
                                  fontSize: "1.9em",
                                  fontWeight: "650",
                                  lineHeight: "1",
                                  letterSpacing: "-0.02em",
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {usedText}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.9em",
                                  lineHeight: "1",
                                  color: "#5B676E",
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                / {limitText}
                              </span>
                            </div>
                            <span
                              style={{
                                display: "block",
                                height: "0.55em",
                                borderRadius: "999px",
                                background: "#E9EEEC",
                                overflow: "hidden",
                              }}
                            >
                              <span
                                style={{
                                  display: "block",
                                  height: "100%",
                                  borderRadius: "999px",
                                  width: `${pct}%`,
                                  background: meterColor,
                                  transition:
                                    "width 0.5s cubic-bezier(.2,.7,.2,1), background 0.3s ease",
                                }}
                              />
                            </span>
                            <span style={{ fontSize: "0.68em", lineHeight: "1", color: "#5B676E" }}>
                              {usageFoot}
                            </span>
                          </div>
                          <div
                            style={{
                              border: "1px solid #E3E8E6",
                              borderRadius: "0.8em",
                              padding: "1.1em 1.2em",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.7em",
                            }}
                          >
                            <span style={{ fontSize: "0.72em", lineHeight: "1", color: "#5B676E" }}>
                              Plan
                            </span>
                            <span
                              style={{ fontSize: "1.35em", fontWeight: "650", lineHeight: "1" }}
                            >
                              {planName}
                            </span>
                            <span
                              style={{ fontSize: "0.68em", lineHeight: "1.3", color: "#5B676E" }}
                            >
                              {planFoot}
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            background: "#0B1215",
                            borderRadius: "0.8em",
                            padding: "1em 1.1em",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.7em",
                            minHeight: "0",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "0.6em",
                              paddingBottom: "0.2em",
                            }}
                          >
                            <span
                              style={{ display: "inline-flex", alignItems: "center", gap: "0.5em" }}
                            >
                              <span
                                className="live-dot"
                                style={{
                                  width: "0.45em",
                                  height: "0.45em",
                                  borderRadius: "999px",
                                  background: "#5FD3B5",
                                }}
                              />
                              <span
                                style={{
                                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                                  fontSize: "0.66em",
                                  lineHeight: "1",
                                  letterSpacing: "0.06em",
                                  color: "#8FA19C",
                                }}
                              >
                                LIVE API EVENTS
                              </span>
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                                fontSize: "0.62em",
                                lineHeight: "1",
                                color: "#6F827D",
                              }}
                            >
                              POST /api/v1/usage
                            </span>
                          </div>
                          {feed.map((e, i) => (
                            <Fragment key={i}>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "3.1em minmax(0, 1fr) 2.4em",
                                  alignItems: "center",
                                  gap: "0.6em",
                                  opacity: e.opacity,
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "1.55em",
                                    borderRadius: "0.35em",
                                    background: e.codeBg,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                                      fontSize: "0.64em",
                                      fontWeight: "600",
                                      lineHeight: "1",
                                      color: e.codeColor,
                                    }}
                                  >
                                    {e.code}
                                  </span>
                                </span>
                                <span
                                  style={{
                                    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                                    fontSize: "0.66em",
                                    lineHeight: "1",
                                    color: "#C5D1CD",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {e.text}
                                </span>
                                <span
                                  style={{
                                    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                                    fontSize: "0.6em",
                                    lineHeight: "1",
                                    color: "#6F827D",
                                    textAlign: "right",
                                  }}
                                >
                                  {e.time}
                                </span>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {isBilling && (
                  <>
                    <div
                      className="scene"
                      style={{ display: "flex", flexDirection: "column", gap: "1em" }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                          gap: "1em",
                          alignItems: "stretch",
                        }}
                      >
                        <div
                          style={{
                            border: "1px solid #E3E8E6",
                            borderRadius: "0.9em",
                            padding: "1.2em",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.8em",
                          }}
                        >
                          <span style={{ fontSize: "0.8em", fontWeight: "600", lineHeight: "1" }}>
                            Free
                          </span>
                          <span style={{ display: "flex", alignItems: "baseline", gap: "0.3em" }}>
                            <span style={{ fontSize: "1.8em", fontWeight: "650", lineHeight: "1" }}>
                              $0
                            </span>
                            <span style={{ fontSize: "0.7em", lineHeight: "1", color: "#5B676E" }}>
                              / month
                            </span>
                          </span>
                          <span style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
                            <span style={{ fontSize: "0.68em", lineHeight: "1", color: "#46535A" }}>
                              3 seats
                            </span>
                            <span style={{ fontSize: "0.68em", lineHeight: "1", color: "#46535A" }}>
                              1,000 units a month
                            </span>
                            <span style={{ fontSize: "0.68em", lineHeight: "1", color: "#46535A" }}>
                              Hard limit, no overage
                            </span>
                          </span>
                          <span
                            style={{
                              marginTop: "auto",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "2.3em",
                              borderRadius: "0.55em",
                              background: "#F2F5F4",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.72em",
                                fontWeight: "500",
                                lineHeight: "1",
                                color: "#5B676E",
                              }}
                            >
                              Current plan
                            </span>
                          </span>
                        </div>
                        <div
                          style={{
                            border: "2px solid var(--lf-accent)",
                            borderRadius: "0.9em",
                            padding: "calc(1.2em - 1px)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.8em",
                            boxShadow:
                              "0 1em 2em -1.4em color-mix(in srgb, var(--lf-accent) 70%, transparent)",
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span style={{ fontSize: "0.8em", fontWeight: "600", lineHeight: "1" }}>
                              Pro
                            </span>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                height: "1.5em",
                                padding: "0 0.6em",
                                borderRadius: "999px",
                                background: "var(--lf-accent)",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.58em",
                                  fontWeight: "600",
                                  lineHeight: "1",
                                  color: "#FFFFFF",
                                }}
                              >
                                Most teams
                              </span>
                            </span>
                          </span>
                          <span style={{ display: "flex", alignItems: "baseline", gap: "0.3em" }}>
                            <span style={{ fontSize: "1.8em", fontWeight: "650", lineHeight: "1" }}>
                              $49
                            </span>
                            <span style={{ fontSize: "0.7em", lineHeight: "1", color: "#5B676E" }}>
                              / month
                            </span>
                          </span>
                          <span style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
                            <span style={{ fontSize: "0.68em", lineHeight: "1", color: "#46535A" }}>
                              10 seats
                            </span>
                            <span style={{ fontSize: "0.68em", lineHeight: "1", color: "#46535A" }}>
                              50,000 units included
                            </span>
                            <span style={{ fontSize: "0.68em", lineHeight: "1", color: "#46535A" }}>
                              $0.002 per extra unit
                            </span>
                          </span>
                          <span
                            data-lf="choose"
                            style={{
                              marginTop: "auto",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "2.3em",
                              borderRadius: "0.55em",
                              background: chooseBg,
                              transition: "background 0.15s ease",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.72em",
                                fontWeight: "500",
                                lineHeight: "1",
                                color: "#FFFFFF",
                              }}
                            >
                              Choose Pro
                            </span>
                          </span>
                        </div>
                        <div
                          style={{
                            border: "1px solid #E3E8E6",
                            borderRadius: "0.9em",
                            padding: "1.2em",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.8em",
                          }}
                        >
                          <span style={{ fontSize: "0.8em", fontWeight: "600", lineHeight: "1" }}>
                            Business
                          </span>
                          <span style={{ display: "flex", alignItems: "baseline", gap: "0.3em" }}>
                            <span style={{ fontSize: "1.8em", fontWeight: "650", lineHeight: "1" }}>
                              $199
                            </span>
                            <span style={{ fontSize: "0.7em", lineHeight: "1", color: "#5B676E" }}>
                              / month
                            </span>
                          </span>
                          <span style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
                            <span style={{ fontSize: "0.68em", lineHeight: "1", color: "#46535A" }}>
                              50 seats
                            </span>
                            <span style={{ fontSize: "0.68em", lineHeight: "1", color: "#46535A" }}>
                              500,000 units included
                            </span>
                            <span style={{ fontSize: "0.68em", lineHeight: "1", color: "#46535A" }}>
                              $0.001 per extra unit
                            </span>
                          </span>
                          <span
                            style={{
                              marginTop: "auto",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "2.3em",
                              boxSizing: "border-box",
                              borderRadius: "0.55em",
                              border: "1px solid #D4DCDA",
                            }}
                          >
                            <span
                              style={{ fontSize: "0.72em", fontWeight: "500", lineHeight: "1" }}
                            >
                              Choose Business
                            </span>
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: "0.66em", lineHeight: "1", color: "#5B676E" }}>
                        Payments run in Stripe test mode.
                      </span>
                    </div>
                  </>
                )}
              </div>
              {/* Checkout */}
              {checkout && (
                <>
                  <div
                    className="fade"
                    style={{
                      position: "absolute",
                      inset: "0",
                      background: "rgba(11,18,21,0.32)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: "3",
                    }}
                  >
                    <div
                      className="pop"
                      style={{
                        width: "24em",
                        boxSizing: "border-box",
                        background: "#FFFFFF",
                        borderRadius: "1em",
                        padding: "1.4em",
                        boxShadow: "0 1.6em 3.2em -1.2em rgba(11,18,21,0.5)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1em",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "1em",
                        }}
                      >
                        <span style={{ fontSize: "1em", fontWeight: "650", lineHeight: "1" }}>
                          Upgrade to Pro
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            height: "1.6em",
                            padding: "0 0.6em",
                            borderRadius: "0.4em",
                            background: "#FEF3C7",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                              fontSize: "0.58em",
                              fontWeight: "600",
                              lineHeight: "1",
                              color: "#8A3F06",
                            }}
                          >
                            TEST MODE
                          </span>
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.85em 0",
                          borderTop: "1px solid #EEF2F1",
                          borderBottom: "1px solid #EEF2F1",
                        }}
                      >
                        <span style={{ fontSize: "0.76em", lineHeight: "1" }}>Pro · monthly</span>
                        <span
                          style={{
                            fontSize: "0.76em",
                            fontWeight: "600",
                            lineHeight: "1",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          $49.00
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
                        <span style={{ fontSize: "0.66em", fontWeight: "600", lineHeight: "1" }}>
                          Card number
                        </span>
                        <span
                          data-lf="card"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: "2.4em",
                            boxSizing: "border-box",
                            padding: "0 0.8em",
                            borderRadius: "0.55em",
                            border: `1px solid ${cardBorder}`,
                            boxShadow: cardRing,
                            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                              fontSize: "0.76em",
                              lineHeight: "1",
                              letterSpacing: "0.04em",
                              color: cardColor,
                            }}
                          >
                            {cardText}
                          </span>
                          {cardFocus && (
                            <>
                              <span
                                className="type-caret"
                                style={{
                                  width: "1px",
                                  height: "1.1em",
                                  marginLeft: "2px",
                                  background: "#0B1215",
                                }}
                              />
                            </>
                          )}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                          gap: "0.8em",
                        }}
                      >
                        <span style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
                          <span style={{ fontSize: "0.66em", fontWeight: "600", lineHeight: "1" }}>
                            Expiry
                          </span>
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              height: "2.4em",
                              boxSizing: "border-box",
                              padding: "0 0.8em",
                              borderRadius: "0.55em",
                              border: "1px solid #D4DCDA",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                                fontSize: "0.76em",
                                lineHeight: "1",
                              }}
                            >
                              12 / 30
                            </span>
                          </span>
                        </span>
                        <span style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
                          <span style={{ fontSize: "0.66em", fontWeight: "600", lineHeight: "1" }}>
                            CVC
                          </span>
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              height: "2.4em",
                              boxSizing: "border-box",
                              padding: "0 0.8em",
                              borderRadius: "0.55em",
                              border: "1px solid #D4DCDA",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                                fontSize: "0.76em",
                                lineHeight: "1",
                              }}
                            >
                              123
                            </span>
                          </span>
                        </span>
                      </div>
                      <span
                        data-lf="pay"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.55em",
                          height: "2.6em",
                          borderRadius: "0.6em",
                          background: payBg,
                          transition: "background 0.15s ease",
                        }}
                      >
                        {paying && (
                          <>
                            <span
                              className="spin"
                              style={{
                                width: "0.9em",
                                height: "0.9em",
                                boxSizing: "border-box",
                                borderRadius: "999px",
                                border: "2px solid rgba(255,255,255,0.35)",
                                borderTopColor: "#FFFFFF",
                              }}
                            />
                          </>
                        )}
                        <span
                          style={{
                            fontSize: "0.76em",
                            fontWeight: "500",
                            lineHeight: "1",
                            color: "#FFFFFF",
                          }}
                        >
                          {payLabel}
                        </span>
                      </span>
                    </div>
                  </div>
                </>
              )}
              {/* Toast */}
              {toast && (
                <>
                  <div
                    className="toast"
                    style={{
                      position: "absolute",
                      right: "1.4em",
                      bottom: "1.4em",
                      zIndex: "4",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75em",
                      background: "#FFFFFF",
                      border: "1px solid #E3E8E6",
                      borderRadius: "0.8em",
                      padding: "0.85em 1.1em 0.85em 0.9em",
                      boxShadow: "0 1em 2.4em -1em rgba(11,18,21,0.38)",
                    }}
                  >
                    <span
                      style={{
                        width: "1.6em",
                        height: "1.6em",
                        flex: "none",
                        borderRadius: "999px",
                        background: "var(--lf-accent)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
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
                    <span style={{ display: "flex", flexDirection: "column", gap: "0.35em" }}>
                      <span style={{ fontSize: "0.76em", fontWeight: "600", lineHeight: "1" }}>
                        Payment confirmed
                      </span>
                      <span style={{ fontSize: "0.66em", lineHeight: "1", color: "#5B676E" }}>
                        Webhook processed · Pro is active
                      </span>
                    </span>
                  </div>
                </>
              )}
              {/* Cursor */}
              {showCursor && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      left: "0",
                      top: "0",
                      zIndex: "6",
                      pointerEvents: "none",
                      transform: `translate(${cx}px, ${cy}px)`,
                      transition: "transform 0.95s cubic-bezier(.22,1,.36,1)",
                    }}
                  >
                    {clicking && (
                      <>
                        <span
                          className="ring"
                          style={{
                            position: "absolute",
                            left: "-1.3em",
                            top: "-1.3em",
                            width: "2.6em",
                            height: "2.6em",
                            borderRadius: "999px",
                            background: "color-mix(in srgb, var(--lf-accent) 28%, transparent)",
                          }}
                        />
                      </>
                    )}
                    <div
                      style={{
                        position: "relative",
                        transform: `scale(${cursorScale})`,
                        transformOrigin: "0 0",
                        transition: "transform 0.14s ease",
                      }}
                    >
                      <svg
                        width="1.3em"
                        height="1.3em"
                        viewBox="0 0 20 20"
                        style={{
                          display: "block",
                          filter: "drop-shadow(0 0.12em 0.22em rgba(11,18,21,0.35))",
                        }}
                      >
                        <path
                          d="M3 2.2l13.6 5.7c.8.3.7 1.4-.1 1.6l-5.6 1.5-2.3 5.4c-.3.8-1.4.7-1.6-.1L2.2 3.1c-.2-.6.3-1.1.8-.9z"
                          fill="var(--lf-accent)"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span
                        style={{
                          position: "absolute",
                          left: "1.15em",
                          top: "1.15em",
                          display: "inline-flex",
                          alignItems: "center",
                          height: "1.55em",
                          padding: "0 0.6em",
                          borderRadius: "999px",
                          background: "var(--lf-accent)",
                          whiteSpace: "nowrap",
                          boxShadow: "0 0.35em 0.9em -0.35em rgba(11,18,21,0.45)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.64em",
                            fontWeight: "600",
                            lineHeight: "1",
                            color: "#FFFFFF",
                          }}
                        >
                          Owner
                        </span>
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {canPause && (
          <>
            <button
              type="button"
              onClick={togglePause}
              aria-pressed={pausedAria}
              style={{
                position: "absolute",
                left: "12px",
                bottom: "12px",
                minHeight: "32px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                font: "inherit",
                fontSize: "12.5px",
                color: "#2F3B42",
                background: "rgba(255,255,255,0.92)",
                border: "1px solid #D4DCDA",
                borderRadius: "999px",
                padding: "4px 12px",
                cursor: "pointer",
              }}
            >
              {pauseLabel}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
