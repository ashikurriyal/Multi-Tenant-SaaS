"use client";

import { usePathname } from "next/navigation";
import DemoAccounts from "./DemoAccounts";

// The brand panel beside the auth forms (large screens only): a teal spotlight, three
// floating product cards and, on log in and sign up, the one-click demo accounts. The copy
// follows the page, crossfading between log in and sign up while the panel stays put.

const COPY = {
  login: {
    eyebrow: "Welcome back",
    title: "Your billing control room, right where you left it.",
    body: "Usage, plans and revenue for every workspace, kept correct by Stripe webhooks that are processed exactly once.",
  },
  register: {
    eyebrow: "Start free",
    title: "Subscriptions, usage and revenue, set up in a minute.",
    body: "Create a workspace on the Free plan, report usage with an API key, and upgrade with exact proration when you need more.",
  },
} as const;

// Shown on the other account pages (forgot password, reset, verify, invite)
const FACTS = [
  "50 parallel requests · never over the limit",
  "Exactly-once webhooks",
  "40 isolation checks in CI",
];

const FEED = [
  { code: "202", text: "documents_processed · +25" },
  { code: "202", text: "documents_processed · +10" },
  { code: "evt", text: "invoice.paid" },
  { code: "202", text: "documents_processed · +40" },
  { code: "202", text: "duplicate · not counted" },
];

export default function AuthShowcase() {
  const pathname = usePathname();
  const mode = pathname.startsWith("/register") ? "register" : "login";
  const withDemos = pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <aside className="as" aria-label="About LedgerFlow">
      <div className="as-glow" aria-hidden />
      <div className="as-grid" aria-hidden />
      <div className="as-beam" aria-hidden />

      <div className="as-inner">
        <span className="as-pill" aria-hidden>
          <span className="as-live" />
          Live demo · Stripe test mode
        </span>

        {(["login", "register"] as const).map((m) => (
          <div key={m} className="as-copy" data-on={m === mode} aria-hidden={m !== mode}>
            <span className="as-eyebrow">{COPY[m].eyebrow}</span>
            <p className="as-title">{COPY[m].title}</p>
            <p className="as-body">{COPY[m].body}</p>
          </div>
        ))}

        <div className="as-stage" aria-hidden>
          <div className="as-card as-usage">
            <div className="as-row">
              <span className="as-label">Usage this period</span>
              <span className="as-amber">81%</span>
            </div>
            <p className="as-big">
              40,500 <span>/ 50,000</span>
            </p>
            <span className="as-meter">
              <span />
            </span>
          </div>

          <div className="as-card as-feed">
            <div className="as-row">
              <span className="as-mono">LIVE API EVENTS</span>
              <span className="as-mono as-dim">POST /api/v1/usage</span>
            </div>
            <div className="as-feed-window">
              <div className="as-feed-list">
                {[...FEED, ...FEED].map((e, i) => (
                  <div key={i} className="as-event">
                    <b data-code={e.code}>{e.code}</b>
                    <span>{e.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="as-card as-mrr">
            <div className="as-row">
              <span className="as-label">MRR</span>
              <span className="as-up">+$786 · 6 mo</span>
            </div>
            <p className="as-big">$2,376</p>
            <svg viewBox="0 0 220 56" className="as-spark">
              <defs>
                <linearGradient id="as-spark-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#5FD3B5" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#5FD3B5" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M2 50 C 30 46, 40 40, 62 38 S 100 30, 120 26 S 160 22, 176 12 S 204 10, 218 14 L218 56 L2 56 Z"
                fill="url(#as-spark-fill)"
              />
              <path
                className="as-spark-line"
                pathLength={1}
                d="M2 50 C 30 46, 40 40, 62 38 S 100 30, 120 26 S 160 22, 176 12 S 204 10, 218 14"
                fill="none"
                stroke="#5FD3B5"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <div className="as-bottom">
          {withDemos ? (
            <DemoAccounts variant="panel" headingId="panel-demo-heading" />
          ) : (
            <div className="as-chips">
              {FACTS.map((c) => (
                <span key={c} className="as-chip">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
