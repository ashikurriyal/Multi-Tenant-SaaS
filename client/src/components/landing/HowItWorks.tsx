import Image from "next/image";

// "How it works": three steps from first payment to the revenue report
export default function HowItWorks() {
  return (
    <>
      <section id="how" style={{ maxWidth: "1200px", margin: "0 auto", padding: "96px 24px" }}>
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
            How it works
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
            From first payment to revenue report, in three steps
          </h2>
        </div>
        <div className="steps">
          <div className="steps-line" aria-hidden="true" />
          <article className="rv step">
            <div
              style={{
                padding: "26px 26px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                flex: "1",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <span className="step-num">01</span>
                <span
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                    gap: "6px",
                  }}
                >
                  <span className="step-tag">Checkout</span>
                  <span className="step-tag">Proration</span>
                </span>
              </div>
              <h3
                style={{
                  margin: "6px 0 0",
                  fontSize: "21px",
                  lineHeight: "1.25",
                  letterSpacing: "-0.015em",
                  fontWeight: "600",
                }}
              >
                Subscribe with Stripe
              </h3>
              <p style={{ margin: "0", fontSize: "16px", lineHeight: "1.55", color: "#46535A" }}>
                Checkout for the first payment, plan changes with an exact proration preview, and
                the Stripe Customer Portal for cards and invoices.
              </p>
            </div>
            <div className="step-media">
              <div className="step-bar" aria-hidden="true">
                <i />
                <i />
                <i />
                <span>/billing</span>
              </div>
              <Image
                src="/landing/billing.png"
                alt="Billing page with the current Pro plan and plan cards"
                width={1280}
                height={900}
                sizes="(max-width: 960px) 100vw, 380px"
              />
            </div>
          </article>
          <article className="rv step">
            <div
              style={{
                padding: "26px 26px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                flex: "1",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <span className="step-num">02</span>
                <span
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                    gap: "6px",
                  }}
                >
                  <span className="step-tag">REST API</span>
                  <span className="step-tag">Idempotent</span>
                </span>
              </div>
              <h3
                style={{
                  margin: "6px 0 0",
                  fontSize: "21px",
                  lineHeight: "1.25",
                  letterSpacing: "-0.015em",
                  fontWeight: "600",
                }}
              >
                Report usage from your app
              </h3>
              <p style={{ margin: "0", fontSize: "16px", lineHeight: "1.55", color: "#46535A" }}>
                One request per event with an API key. Retries are never counted twice, and the Free
                limit holds even under a burst.
              </p>
            </div>
            <div className="step-media dark">
              <div className="step-bar" aria-hidden="true">
                <i />
                <i />
                <i />
                <span>usage.http</span>
              </div>
              <pre
                style={{
                  margin: "0",
                  minHeight: "200px",
                  boxSizing: "border-box",
                  padding: "18px 16px",
                  color: "#D7E2DF",
                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                  fontSize: "12px",
                  lineHeight: "1.7",
                  overflow: "hidden",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                <span style={{ color: "#5FD3B5" }}>{"POST"}</span>
                {" /api/v1/usage\n"}
                <span style={{ color: "#8FA19C" }}>{"x-api-key:"}</span>
                {" lf_live_3Hq9\u2026\n\n{\n  "}
                <span style={{ color: "#9DB8F5" }}>{'"metric"'}</span>
                {": "}
                <span style={{ color: "#F2C66D" }}>{'"documents_processed"'}</span>
                {",\n  "}
                <span style={{ color: "#9DB8F5" }}>{'"quantity"'}</span>
                {": "}
                <span style={{ color: "#F2C66D" }}>{"25"}</span>
                {",\n  "}
                <span style={{ color: "#9DB8F5" }}>{'"idempotencyKey"'}</span>
                {": "}
                <span style={{ color: "#F2C66D" }}>{'"job-8831-batch-2"'}</span>
                {"\n}"}
              </pre>
            </div>
          </article>
          <article className="rv step">
            <div
              style={{
                padding: "26px 26px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                flex: "1",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <span className="step-num">03</span>
                <span
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                    gap: "6px",
                  }}
                >
                  <span className="step-tag">Quotas</span>
                  <span className="step-tag">Charts</span>
                </span>
              </div>
              <h3
                style={{
                  margin: "6px 0 0",
                  fontSize: "21px",
                  lineHeight: "1.25",
                  letterSpacing: "-0.015em",
                  fontWeight: "600",
                }}
              >
                See usage and revenue
              </h3>
              <p style={{ margin: "0", fontSize: "16px", lineHeight: "1.55", color: "#46535A" }}>
                Usage against quota with a projection for the period, banners at 80% and 100%, and
                daily charts for any range.
              </p>
            </div>
            <div className="step-media">
              <div className="step-bar" aria-hidden="true">
                <i />
                <i />
                <i />
                <span>/usage</span>
              </div>
              <Image
                src="/landing/usage.png"
                alt="Usage page with range presets and a daily usage chart"
                width={1280}
                height={820}
                sizes="(max-width: 960px) 100vw, 380px"
              />
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
