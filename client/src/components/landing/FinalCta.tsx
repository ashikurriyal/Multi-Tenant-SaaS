import Link from "next/link";

// The closing call to action: a dark panel, a fanned stack of demo accounts and an
// event ticker
export default function FinalCta() {
  return (
    <>
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "8px 24px 96px" }}>
        <div
          className="rv cta"
          style={{
            position: "relative",
            overflow: "hidden",
            isolation: "isolate",
            borderRadius: "28px",
            background: "#0B1215",
            color: "#E6EEEC",
            border: "1px solid #1C2A2F",
            boxShadow: "0 40px 80px -48px rgba(11,18,21,.8)",
          }}
        >
          <div className="cta-aurora" aria-hidden="true">
            <span className="a1" />
            <span className="a2" />
          </div>
          <div className="cta-grid" aria-hidden="true" />
          <div className="cta-inner">
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: "0" }}>
              <span
                style={{
                  alignSelf: "flex-start",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  height: "30px",
                  padding: "0 12px",
                  borderRadius: "999px",
                  background: "rgba(95,211,181,.1)",
                  border: "1px solid rgba(95,211,181,.25)",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#BFEFE0",
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
                Live demo · Stripe test mode
              </span>
              <h2
                style={{
                  margin: "0",
                  fontSize: "clamp(32px, 4vw, 52px)",
                  lineHeight: "1.04",
                  letterSpacing: "-0.035em",
                  fontWeight: "650",
                  color: "#FFFFFF",
                }}
              >
                See it running in
                <br />
                <span className="pf-grad">under a minute</span>
              </h2>
              <p
                style={{
                  margin: "0",
                  maxWidth: "460px",
                  fontSize: "17px",
                  lineHeight: "1.6",
                  color: "#A9B8B4",
                }}
              >
                Open a demo account with one click, no password needed, or start your own workspace
                on the Free plan.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "4px" }}>
                <Link
                  className="btn-primary cta-shine cta-main"
                  href="/login"
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    textDecoration: "none",
                    color: "#0B1215",
                    background: "#5FD3B5",
                    padding: "0 22px",
                    borderRadius: "12px",
                    minHeight: "50px",
                    boxSizing: "border-box",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Try the live demo
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
                <Link className="cta-ghost" href="/register">
                  Create a free account
                </Link>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "6px",
                }}
              >
                <span className="cta-step">
                  <span>1</span>
                  Pick an account
                </span>
                <span className="cta-sep" aria-hidden="true" />
                <span className="cta-step">
                  <span>2</span>
                  Explore billing and usage
                </span>
                <span className="cta-sep" aria-hidden="true" />
                <span className="cta-step">
                  <span>3</span>
                  Upgrade with 4242…
                </span>
              </div>
            </div>
            <div className="cta-stack" aria-hidden="true">
              <div className="cta-card c3">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "9px",
                        background: "#2F3B42",
                        color: "#FFFFFF",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      IN
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "600", lineHeight: "1" }}>
                        Initech
                      </span>
                      <span style={{ fontSize: "11.5px", lineHeight: "1", color: "#5B676E" }}>
                        Owner
                      </span>
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: "600",
                      color: "#3F4B52",
                      background: "#EEF2F1",
                      borderRadius: "999px",
                      padding: "3px 9px",
                    }}
                  >
                    Free · 95%
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11.5px",
                    color: "#5B676E",
                  }}
                >
                  <span>Usage</span>
                  <span style={{ fontWeight: "600", color: "#C0352B" }}>950 / 1,000</span>
                </div>
                <span
                  style={{
                    display: "block",
                    height: "6px",
                    borderRadius: "999px",
                    background: "#E6ECEA",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      height: "100%",
                      width: "95%",
                      borderRadius: "999px",
                      background: "#C0352B",
                    }}
                  />
                </span>
              </div>
              <div className="cta-card c2">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "9px",
                        background: "#7A2E1E",
                        color: "#FFFFFF",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      GL
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "600", lineHeight: "1" }}>
                        Globex
                      </span>
                      <span style={{ fontSize: "11.5px", lineHeight: "1", color: "#5B676E" }}>
                        Owner
                      </span>
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: "600",
                      color: "#A33A1E",
                      background: "#FCEDE8",
                      borderRadius: "999px",
                      padding: "3px 9px",
                    }}
                  >
                    Past due
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11.5px",
                    color: "#5B676E",
                  }}
                >
                  <span>Grace period</span>
                  <span style={{ fontWeight: "600", color: "#E0533F" }}>7 days</span>
                </div>
                <span
                  style={{
                    display: "block",
                    height: "6px",
                    borderRadius: "999px",
                    background: "#E6ECEA",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      height: "100%",
                      width: "14%",
                      borderRadius: "999px",
                      background: "#E0533F",
                    }}
                  />
                </span>
              </div>
              <div className="cta-card c1">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "9px",
                        background: "#0B1215",
                        color: "#FFFFFF",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      AC
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "600", lineHeight: "1" }}>
                        Acme Corp
                      </span>
                      <span style={{ fontSize: "11.5px", lineHeight: "1", color: "#5B676E" }}>
                        Owner
                      </span>
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: "600",
                      color: "#0A6152",
                      background: "color-mix(in srgb, var(--lf-accent) 10%, #FFFFFF)",
                      borderRadius: "999px",
                      padding: "3px 9px",
                    }}
                  >
                    Pro · active
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11.5px",
                    color: "#5B676E",
                  }}
                >
                  <span>Usage</span>
                  <span style={{ fontWeight: "600", color: "#C27C0E" }}>81%</span>
                </div>
                <span
                  style={{
                    display: "block",
                    height: "6px",
                    borderRadius: "999px",
                    background: "#E6ECEA",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      height: "100%",
                      width: "81%",
                      borderRadius: "999px",
                      background: "#C27C0E",
                    }}
                  />
                </span>
              </div>
            </div>
          </div>
          <div className="cta-ticker" aria-hidden="true">
            <div className="cta-track">
              <span className="cta-ev">
                <b style={{ color: "#5FD3B5" }}>202</b>
                usage recorded · +25
              </span>
              <span className="cta-ev">
                <b style={{ color: "#9DB8F5" }}>evt</b>
                invoice.paid
              </span>
              <span className="cta-ev">
                <b style={{ color: "#5FD3B5" }}>202</b>
                usage recorded · +10
              </span>
              <span className="cta-ev">
                <b style={{ color: "#D4F7A1" }}>plan</b>
                acme → business
              </span>
              <span className="cta-ev">
                <b style={{ color: "#F2C66D" }}>429</b>
                PLAN_LIMIT_USAGE
              </span>
              <span className="cta-ev">
                <b style={{ color: "#9DB8F5" }}>evt</b>
                customer.subscription.updated
              </span>
              <span className="cta-ev">
                <b style={{ color: "#5FD3B5" }}>202</b>
                usage recorded · +40
              </span>
              <span className="cta-ev">
                <b style={{ color: "#D4F7A1" }}>mrr</b>
                snapshot saved · $2,376
              </span>
              <span className="cta-ev">
                <b style={{ color: "#F49AA9" }}>evt</b>
                invoice.payment_failed
              </span>
              <span className="cta-ev">
                <b style={{ color: "#5FD3B5" }}>202</b>
                duplicate · not counted
              </span>
              <span className="cta-ev">
                <b style={{ color: "#5FD3B5" }}>202</b>
                usage recorded · +25
              </span>
              <span className="cta-ev">
                <b style={{ color: "#9DB8F5" }}>evt</b>
                invoice.paid
              </span>
              <span className="cta-ev">
                <b style={{ color: "#5FD3B5" }}>202</b>
                usage recorded · +10
              </span>
              <span className="cta-ev">
                <b style={{ color: "#D4F7A1" }}>plan</b>
                acme → business
              </span>
              <span className="cta-ev">
                <b style={{ color: "#F2C66D" }}>429</b>
                PLAN_LIMIT_USAGE
              </span>
              <span className="cta-ev">
                <b style={{ color: "#9DB8F5" }}>evt</b>
                customer.subscription.updated
              </span>
              <span className="cta-ev">
                <b style={{ color: "#5FD3B5" }}>202</b>
                usage recorded · +40
              </span>
              <span className="cta-ev">
                <b style={{ color: "#D4F7A1" }}>mrr</b>
                snapshot saved · $2,376
              </span>
              <span className="cta-ev">
                <b style={{ color: "#F49AA9" }}>evt</b>
                invoice.payment_failed
              </span>
              <span className="cta-ev">
                <b style={{ color: "#5FD3B5" }}>202</b>
                duplicate · not counted
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
