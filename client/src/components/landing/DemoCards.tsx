import Link from "next/link";

// "Try it": the four one-click demo accounts on the login page
export default function DemoCards() {
  return (
    <>
      <section
        id="demo"
        data-lf-io
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "96px 24px" }}
      >
        <div
          className="rv"
          style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "720px" }}
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
            Try it
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
            Pick a demo account. One click, no password.
          </h2>
          <p style={{ margin: "0", fontSize: "17px", lineHeight: "1.6", color: "#46535A" }}>
            Each one starts in a real situation, on real Stripe test subscriptions. The demo data is
            rebuilt every night.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            marginTop: "44px",
          }}
        >
          <Link className="rv dm-card" href="/login" style={{ "--tone": "var(--lf-accent)" }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <span className="dm-av" style={{ background: "#0B1215" }}>
                AC
              </span>
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: "600",
                  color: "#0A6152",
                  background: "color-mix(in srgb, var(--lf-accent) 10%, #FFFFFF)",
                  borderRadius: "999px",
                  padding: "4px 10px",
                }}
              >
                Pro · active
              </span>
            </span>
            <span
              style={{ fontSize: "18px", fontWeight: "600", lineHeight: "1.25", marginTop: "2px" }}
            >
              Owner at Acme
            </span>
            <span style={{ fontSize: "14.5px", lineHeight: "1.5", color: "#46535A" }}>
              Usage at 81% with the warning banner, a plan change with Stripe’s proration preview,
              the billing portal.
            </span>
            <div className="dm-strip">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#5B676E" }}>Usage</span>
                <span
                  style={{
                    fontWeight: "600",
                    color: "#C27C0E",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  81%
                </span>
              </div>
              <span className="dm-meter">
                <span className="dm-fill" style={{ width: "81%", background: "#C27C0E" }} />
              </span>
            </div>
            <span className="dm-cta">
              Log in as Acme owner
              <svg
                className="btn-arrow"
                width="14"
                height="14"
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
            </span>
          </Link>
          <Link className="rv dm-card" href="/login" style={{ "--tone": "#4F6BED" }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <span className="dm-av" style={{ background: "#0B1215" }}>
                AC
              </span>
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: "600",
                  color: "#2F4FB8",
                  background: "#EDF1FD",
                  borderRadius: "999px",
                  padding: "4px 10px",
                }}
              >
                Role · Billing
              </span>
            </span>
            <span
              style={{ fontSize: "18px", fontWeight: "600", lineHeight: "1.25", marginTop: "2px" }}
            >
              Billing user at Acme
            </span>
            <span style={{ fontSize: "14.5px", lineHeight: "1.5", color: "#46535A" }}>
              Manages the plan and invoices, but can’t manage members or API keys.
            </span>
            <div
              className="dm-strip"
              style={{ flexDirection: "row", flexWrap: "wrap", gap: "6px" }}
            >
              <span className="dm-perm ok">✓ Plan</span>
              <span className="dm-perm ok">✓ Invoices</span>
              <span className="dm-perm no">✕ Members</span>
              <span className="dm-perm no">✕ API keys</span>
            </div>
            <span className="dm-cta">
              Log in as Acme billing user
              <svg
                className="btn-arrow"
                width="14"
                height="14"
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
            </span>
          </Link>
          <Link className="rv dm-card" href="/login" style={{ "--tone": "#E0533F" }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <span className="dm-av" style={{ background: "#7A2E1E" }}>
                GL
              </span>
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: "600",
                  color: "#A33A1E",
                  background: "#FCEDE8",
                  borderRadius: "999px",
                  padding: "4px 10px",
                }}
              >
                Past due
              </span>
            </span>
            <span
              style={{ fontSize: "18px", fontWeight: "600", lineHeight: "1.25", marginTop: "2px" }}
            >
              Owner at Globex
            </span>
            <span style={{ fontSize: "14.5px", lineHeight: "1.5", color: "#46535A" }}>
              A renewal that really failed in Stripe: the payment banner and a 7-day grace period.
            </span>
            <div className="dm-strip">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#5B676E" }}>Grace period</span>
                <span style={{ fontWeight: "600", color: "#B42C22" }}>7 days</span>
              </div>
              <span className="dm-segs">
                <i style={{ "--i": "0" }} />
                <i style={{ "--i": "1" }} />
                <i style={{ "--i": "2" }} />
                <i style={{ "--i": "3" }} />
                <i style={{ "--i": "4" }} />
                <i style={{ "--i": "5" }} />
                <i style={{ "--i": "6" }} />
              </span>
            </div>
            <span className="dm-cta">
              Log in as Globex owner
              <svg
                className="btn-arrow"
                width="14"
                height="14"
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
            </span>
          </Link>
          <Link className="rv dm-card" href="/login" style={{ "--tone": "#C0352B" }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <span className="dm-av" style={{ background: "#2F3B42" }}>
                IN
              </span>
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: "600",
                  color: "#3F4B52",
                  background: "#EEF2F1",
                  borderRadius: "999px",
                  padding: "4px 10px",
                }}
              >
                Free · 95%
              </span>
            </span>
            <span
              style={{ fontSize: "18px", fontWeight: "600", lineHeight: "1.25", marginTop: "2px" }}
            >
              Owner at Initech
            </span>
            <span style={{ fontSize: "14.5px", lineHeight: "1.5", color: "#46535A" }}>
              Almost at the Free limit: at 100% new usage is rejected and upgrade prompts appear.
            </span>
            <div className="dm-strip">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#5B676E" }}>Usage</span>
                <span
                  style={{
                    fontWeight: "600",
                    color: "#C0352B",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  950 / 1,000
                </span>
              </div>
              <span className="dm-meter">
                <span className="dm-fill" style={{ width: "95%", background: "#C0352B" }} />
              </span>
            </div>
            <span className="dm-cta">
              Log in as Initech owner
              <svg
                className="btn-arrow"
                width="14"
                height="14"
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
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
