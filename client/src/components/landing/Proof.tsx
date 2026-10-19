// "Built to be correct": the measured claims, each with a small visual. Their intro
// animations play once the section scrolls into view (data-lf-io, see LandingEffects)
export default function Proof() {
  return (
    <>
      <section
        className="pf"
        data-lf-io
        style={{
          position: "relative",
          overflow: "hidden",
          isolation: "isolate",
          background: "#0B1215",
          color: "#E6EEEC",
        }}
      >
        <div className="pf-bg" aria-hidden="true" />
        <div
          style={{
            position: "relative",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "112px 24px",
          }}
        >
          <div
            className="rv"
            style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "760px" }}
          >
            <p
              style={{
                margin: "0",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: "600",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "color-mix(in srgb, var(--lf-accent) 45%, #FFFFFF)",
              }}
            >
              <span
                className="ping"
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "999px",
                  background: "#5FD3B5",
                }}
              />
              Built to be correct
            </p>
            <h2
              style={{
                margin: "0",
                fontSize: "clamp(30px, 3.4vw, 44px)",
                lineHeight: "1.1",
                letterSpacing: "-0.025em",
                fontWeight: "650",
                color: "#FFFFFF",
              }}
            >
              The hard parts, <span className="pf-grad">measured</span>
            </h2>
            <p style={{ margin: "0", fontSize: "17px", lineHeight: "1.6", color: "#A9B8B4" }}>
              Billing bugs cost money and trust. These are tested against a real database and
              Stripe, not assumed.
            </p>
          </div>
          <div className="pf-grid">
            <article className="rv pf-card pf-wide">
              <span className="pf-eyebrow">
                <svg
                  width="15"
                  height="15"
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
                Concurrency
              </span>
              <div className="pf-split">
                <div
                  style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: "0" }}
                >
                  <p className="pf-num">
                    33 <span>of 50</span>
                  </p>
                  <p className="pf-text">
                    simultaneous 30-unit requests accepted at a 1,000-unit limit. The counter stops
                    at 990, never over.
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginTop: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                        fontSize: "12px",
                        color: "#8FA19C",
                      }}
                    >
                      <span>Counter</span>
                      <span style={{ color: "#E6EEEC" }}>990 / 1,000</span>
                    </div>
                    <span className="pf-meter">
                      <span className="pf-meter-fill" />
                    </span>
                  </div>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: "0" }}
                  aria-hidden="true"
                >
                  <div className="pf-dots">
                    <span className="pf-dot ok" style={{ animationDelay: "0ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "22ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "44ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "66ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "88ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "110ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "132ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "154ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "176ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "198ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "220ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "242ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "264ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "286ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "308ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "330ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "352ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "374ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "396ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "418ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "440ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "462ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "484ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "506ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "528ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "550ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "572ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "594ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "616ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "638ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "660ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "682ms" }} />
                    <span className="pf-dot ok" style={{ animationDelay: "704ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "726ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "748ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "770ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "792ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "814ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "836ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "858ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "880ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "902ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "924ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "946ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "968ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "990ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "1012ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "1034ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "1056ms" }} />
                    <span className="pf-dot no" style={{ animationDelay: "1078ms" }} />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px 16px",
                      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                      fontSize: "11.5px",
                      color: "#8FA19C",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <span
                        className="pf-dot ok"
                        style={{ animation: "none", width: "9px", height: "9px" }}
                      />
                      202 accepted · 33
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <span
                        className="pf-dot no"
                        style={{ animation: "none", width: "9px", height: "9px" }}
                      />
                      429 rejected · 17
                    </span>
                  </div>
                </div>
              </div>
            </article>
            <article className="rv pf-card">
              <span className="pf-eyebrow">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 12h16M14 6l6 6-6 6" />
                </svg>
                Stripe webhooks
              </span>
              <p className="pf-num">Exactly once</p>
              <p className="pf-text">
                Signed, stored, claimed atomically and retried with backoff.
              </p>
              <ol className="pf-steps">
                <li className="pf-step" style={{ "--i": "0" }}>
                  <span className="pf-node" />
                  Signature verified
                </li>
                <li className="pf-step" style={{ "--i": "1" }}>
                  <span className="pf-node" />
                  Stored in the inbox
                </li>
                <li className="pf-step" style={{ "--i": "2" }}>
                  <span className="pf-node" />
                  Claimed atomically
                </li>
                <li className="pf-step" style={{ "--i": "3" }}>
                  <span className="pf-node" />
                  Processed once
                </li>
                <li className="pf-step" style={{ "--i": "4" }}>
                  <span className="pf-node" />
                  Reconciled nightly
                </li>
              </ol>
            </article>
            <article className="rv pf-card">
              <span className="pf-eyebrow">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                Tenant isolation
              </span>
              <p className="pf-num">
                40 <span>checks</span>
              </p>
              <p className="pf-text">
                Tenant-isolation and permission checks against PostgreSQL in CI, on every pull
                request.
              </p>
              <div className="pf-term" aria-hidden="true">
                <div className="pf-tl" style={{ "--i": "0" }}>
                  <span style={{ color: "#5B6E69" }}>postgres:16</span>{" "}
                  <span style={{ color: "#5FD3B5" }}>ready</span>
                </div>
                <div className="pf-tl" style={{ "--i": "1" }}>
                  <span style={{ color: "#5FD3B5" }}>$</span> npx prisma migrate deploy
                </div>
                <div className="pf-tl" style={{ "--i": "2" }}>
                  <span style={{ color: "#5FD3B5" }}>$</span> npm run verify:tenancy
                </div>
                <div className="pf-tl" style={{ "--i": "3" }}>
                  <span className="pf-pass">✓ 40 passed</span>{" "}
                  <span style={{ color: "#5B6E69" }}>· 0 failed</span>
                </div>
              </div>
            </article>
            <article className="rv pf-card pf-wide">
              <span className="pf-eyebrow">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 12h4l3-8 4 16 3-8h4" />
                </svg>
                Metering
              </span>
              <div className="pf-split">
                <div
                  style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: "0" }}
                >
                  <p className="pf-num">
                    0 <span>double charges</span>
                  </p>
                  <p className="pf-text">
                    Usage goes to the Stripe meter with a per-event identifier, so a retry can never
                    bill twice. Stripe’s total matched the units we reported.
                  </p>
                </div>
                <div className="pf-match" aria-hidden="true">
                  <div className="pf-mrow">
                    <span className="pf-key">Reported by LedgerFlow</span>
                    <span className="pf-bar">
                      <span className="pf-bar-fill" />
                    </span>
                  </div>
                  <div className="pf-mrow">
                    <span className="pf-key k2">Counted by Stripe’s meter</span>
                    <span className="pf-bar">
                      <span className="pf-bar-fill b2" />
                    </span>
                  </div>
                  <span className="pf-badge">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Totals match
                  </span>
                </div>
              </div>
            </article>
          </div>
          <div
            className="rv"
            style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "36px" }}
          >
            <a
              className="pf-link"
              href="https://github.com/ashikurriyal/Multi-Tenant-SaaS/tree/main/docs/adr"
            >
              Read the architecture decisions
              <svg
                className="btn-arrow"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a className="pf-link" href="https://github.com/ashikurriyal/Multi-Tenant-SaaS">
              Browse the source on GitHub
              <svg
                className="btn-arrow"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
