// The six feature cards; each icon has its own hover animation (landing.css)
export default function Features() {
  return (
    <>
      <section
        id="features"
        style={{
          background: "#F7F9F8",
          borderTop: "1px solid #E8EDEB",
          borderBottom: "1px solid #E8EDEB",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "96px 24px" }}>
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
              Features
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
              Everything a B2B SaaS needs around billing
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
              marginTop: "48px",
            }}
          >
            <article className="rv feat">
              <span className="feat-icon">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path className="ic-p2" d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
                </svg>
              </span>
              <h3
                style={{
                  margin: "6px 0 0",
                  fontSize: "19px",
                  lineHeight: "1.3",
                  letterSpacing: "-0.01em",
                  fontWeight: "600",
                }}
              >
                Organizations and roles
              </h3>
              <p style={{ margin: "0", fontSize: "15.5px", lineHeight: "1.55", color: "#46535A" }}>
                Owner, Admin, Billing and Member roles, email invitations and seat limits per plan.
                Other organizations&apos; data answers 404, never 403.
              </p>
              <span className="feat-proof">4 roles · 404, never 403</span>
            </article>
            <article className="rv feat">
              <span className="feat-icon">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path className="ic-bar" d="M6 20v-4" />
                  <path className="ic-bar b2" d="M12 20V10" />
                  <path className="ic-bar b3" d="M18 20V4" />
                </svg>
              </span>
              <h3
                style={{
                  margin: "6px 0 0",
                  fontSize: "19px",
                  lineHeight: "1.3",
                  letterSpacing: "-0.01em",
                  fontWeight: "600",
                }}
              >
                Metered usage with real limits
              </h3>
              <p style={{ margin: "0", fontSize: "15.5px", lineHeight: "1.55", color: "#46535A" }}>
                Free stops at its limit with a clear 429; paid plans continue into overage, billed
                through a Stripe meter. Idempotent by design.
              </p>
              <span className="feat-proof">429 at the limit · overage on paid</span>
            </article>
            <article className="rv feat">
              <span className="feat-icon">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="ic-card"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20M6 15h4" />
                </svg>
              </span>
              <h3
                style={{
                  margin: "6px 0 0",
                  fontSize: "19px",
                  lineHeight: "1.3",
                  letterSpacing: "-0.01em",
                  fontWeight: "600",
                }}
              >
                Stripe billing, end to end
              </h3>
              <p style={{ margin: "0", fontSize: "15.5px", lineHeight: "1.55", color: "#46535A" }}>
                Checkout, upgrades and downgrades with proration, the Customer Portal, and a 7-day
                grace period with emails when a payment fails.
              </p>
              <span className="feat-proof">Proration · 7-day grace</span>
            </article>
            <article className="rv feat">
              <span className="feat-icon">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 3v18h18" />
                  <path className="ic-draw" pathLength="1" d="M7 15l4-4 3 3 5-6" />
                </svg>
              </span>
              <h3
                style={{
                  margin: "6px 0 0",
                  fontSize: "19px",
                  lineHeight: "1.3",
                  letterSpacing: "-0.01em",
                  fontWeight: "600",
                }}
              >
                Revenue analytics
              </h3>
              <p style={{ margin: "0", fontSize: "15.5px", lineHeight: "1.55", color: "#46535A" }}>
                MRR and its movements, customer churn, net revenue retention and ARPA for 6, 12 or
                24 months, from daily snapshots.
              </p>
              <span className="feat-proof">MRR · churn · NRR · ARPA</span>
            </article>
            <article className="rv feat">
              <span className="feat-icon">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="ic-key"
                >
                  <circle cx="8" cy="15" r="4" />
                  <path d="M10.8 12.2L20 3M17 6l3 3M14 9l2 2" />
                </svg>
              </span>
              <h3
                style={{
                  margin: "6px 0 0",
                  fontSize: "19px",
                  lineHeight: "1.3",
                  letterSpacing: "-0.01em",
                  fontWeight: "600",
                }}
              >
                API keys
              </h3>
              <p style={{ margin: "0", fontSize: "15.5px", lineHeight: "1.55", color: "#46535A" }}>
                Create keys for each environment, shown once and stored only as a hash. Revoking
                takes effect on the very next request.
              </p>
              <span className="feat-proof">Shown once · hashed at rest</span>
            </article>
            <article className="rv feat">
              <span className="feat-icon">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                  <path d="M14 3v6h6" />
                  <path className="ic-draw" pathLength="1" d="M8 13h8" />
                  <path className="ic-draw d2" pathLength="1" d="M8 17h5" />
                </svg>
              </span>
              <h3
                style={{
                  margin: "6px 0 0",
                  fontSize: "19px",
                  lineHeight: "1.3",
                  letterSpacing: "-0.01em",
                  fontWeight: "600",
                }}
              >
                Audit log
              </h3>
              <p style={{ margin: "0", fontSize: "15.5px", lineHeight: "1.55", color: "#46535A" }}>
                Every invitation, role change, API key and billing change, written in plain
                sentences with who made it, including Stripe and scheduled jobs.
              </p>
              <span className="feat-proof">Who, what and when</span>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
