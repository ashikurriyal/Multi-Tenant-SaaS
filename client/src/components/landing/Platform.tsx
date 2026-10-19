import RevenuePreview from "./RevenuePreview";

// "For the platform team": the super-admin revenue view, with a working range switch
export default function Platform() {
  return (
    <>
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "96px 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "48px",
        }}
      >
        <div
          className="rv"
          style={{
            flex: "1 1 340px",
            minWidth: "0",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
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
            For the platform team
          </p>
          <h2
            style={{
              margin: "0",
              fontSize: "clamp(28px, 3vw, 40px)",
              lineHeight: "1.12",
              letterSpacing: "-0.025em",
              fontWeight: "650",
            }}
          >
            Revenue health across every customer
          </h2>
          <p style={{ margin: "0", fontSize: "17px", lineHeight: "1.6", color: "#46535A" }}>
            A super-admin view with MRR, what moved it each month, churn, NRR and ARPA, plus every
            organization and any Stripe event that failed to process.
          </p>
          <ul
            style={{
              margin: "8px 0 0",
              padding: "0",
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              fontSize: "16px",
              color: "#2F3B42",
            }}
          >
            <li style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--lf-accent)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ flex: "none", marginTop: "2px" }}
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              New, expansion, contraction, churn and reactivation per month
            </li>
            <li style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--lf-accent)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ flex: "none", marginTop: "2px" }}
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Rates from complete months, so a partial month never flatters churn
            </li>
            <li style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--lf-accent)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ flex: "none", marginTop: "2px" }}
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Webhook inbox with retries and exhausted events flagged
            </li>
          </ul>
        </div>
        <RevenuePreview />
      </section>
    </>
  );
}
