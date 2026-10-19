"use client";

import { useEffect, useRef, useState } from "react";

// FAQ "spec explorer": six questions on the left, the answer with a small visual of the
// mechanism and its source file on the right. It advances every 9 s until the visitor
// picks a question (and never for visitors who prefer reduced motion).

const ROW = 72; // .fx-q height in landing.css
const COUNT = 6;

export default function Faq() {
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- motion preference is only known in the browser
      setAuto(false);
      return;
    }
    timer.current = setInterval(() => setIdx((i) => (i + 1) % COUNT), 9000);
    return () => clearInterval(timer.current);
  }, []);

  // A click takes over from auto-advance for good
  const pick = (i: number) => {
    clearInterval(timer.current);
    setAuto(false);
    setIdx(i);
  };

  const fqAutoClass = auto ? "fx-auto" : "";
  const fqY = idx * ROW;
  const fqNext = () => pick((idx + 1) % COUNT);
  const [fqOn0, fqOn1, fqOn2, fqOn3, fqOn4, fqOn5] = Array.from(
    { length: COUNT },
    (_, i) => idx === i,
  );
  const [fqP0, fqP1, fqP2, fqP3, fqP4, fqP5] = [fqOn0, fqOn1, fqOn2, fqOn3, fqOn4, fqOn5].map(
    (on) => (on ? "true" : "false") as "true" | "false",
  );
  const [fqPick0, fqPick1, fqPick2, fqPick3, fqPick4, fqPick5] = Array.from(
    { length: COUNT },
    (_, i) => () => pick(i),
  );

  return (
    <>
      <section
        id="faq"
        data-lf-io
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "88px 24px" }}
      >
        <div
          className="rv"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "16px 32px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "640px" }}>
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
              FAQ
            </p>
            <h2
              style={{
                margin: "0",
                fontSize: "clamp(28px, 3vw, 38px)",
                lineHeight: "1.12",
                letterSpacing: "-0.025em",
                fontWeight: "650",
              }}
            >
              How it holds up in production
            </h2>
            <p style={{ margin: "0", fontSize: "16px", lineHeight: "1.55", color: "#46535A" }}>
              Six questions engineers ask about billing systems, each answered with the mechanism
              and the file that implements it.
            </p>
          </div>
        </div>
        <div className={`rv fx-shell ${fqAutoClass}`}>
          <div className="fx-list" role="group" aria-label="Questions">
            <span
              className="fx-ind"
              aria-hidden="true"
              style={{ transform: `translateY(${fqY}px)` }}
            />
            <button
              type="button"
              className="fx-q"
              onClick={fqPick0}
              aria-pressed={fqP0}
              data-on={fqP0}
            >
              <span className="fx-num">01</span>
              <span className="fx-qt">How is each customer’s data kept separate?</span>
              {fqOn0 && (
                <>
                  <span className="fx-prog" aria-hidden="true" />
                </>
              )}
            </button>
            <button
              type="button"
              className="fx-q"
              onClick={fqPick1}
              aria-pressed={fqP1}
              data-on={fqP1}
            >
              <span className="fx-num">02</span>
              <span className="fx-qt">Can a burst of requests go over the limit?</span>
              {fqOn1 && (
                <>
                  <span className="fx-prog" aria-hidden="true" />
                </>
              )}
            </button>
            <button
              type="button"
              className="fx-q"
              onClick={fqPick2}
              aria-pressed={fqP2}
              data-on={fqP2}
            >
              <span className="fx-num">03</span>
              <span className="fx-qt">What if Stripe sends the same event twice?</span>
              {fqOn2 && (
                <>
                  <span className="fx-prog" aria-hidden="true" />
                </>
              )}
            </button>
            <button
              type="button"
              className="fx-q"
              onClick={fqPick3}
              aria-pressed={fqP3}
              data-on={fqP3}
            >
              <span className="fx-num">04</span>
              <span className="fx-qt">How do upgrades and downgrades work?</span>
              {fqOn3 && (
                <>
                  <span className="fx-prog" aria-hidden="true" />
                </>
              )}
            </button>
            <button
              type="button"
              className="fx-q"
              onClick={fqPick4}
              aria-pressed={fqP4}
              data-on={fqP4}
            >
              <span className="fx-num">05</span>
              <span className="fx-qt">How is usage beyond the plan billed?</span>
              {fqOn4 && (
                <>
                  <span className="fx-prog" aria-hidden="true" />
                </>
              )}
            </button>
            <button
              type="button"
              className="fx-q"
              onClick={fqPick5}
              aria-pressed={fqP5}
              data-on={fqP5}
            >
              <span className="fx-num">06</span>
              <span className="fx-qt">What happens when a payment fails?</span>
              {fqOn5 && (
                <>
                  <span className="fx-prog" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
          <div className="fx-stage" aria-live="polite">
            {fqOn0 && (
              <>
                <div className="fx-panel">
                  <span className="fx-tag">Tenant isolation</span>
                  <h3 className="fx-h">How is each customer’s data kept separate?</h3>
                  <p className="fx-a">
                    Every query goes through a tenant-scoped client that adds the organization for
                    you. Another organization’s ids answer 404, never 403, and 40 isolation checks
                    run in CI on every pull request.
                  </p>
                  <div className="fx-vis">
                    <div className="fx-code">
                      <div>
                        <span style={{ color: "#6F827D" }}>{"// what the service writes"}</span>
                      </div>
                      <div>
                        db.invoice.findMany({"{"} where: {"{"} status:{" "}
                        <span style={{ color: "#F2C66D" }}>&apos;paid&apos;</span> {"}"} {"}"})
                      </div>
                      <div style={{ marginTop: "8px" }}>
                        <span style={{ color: "#6F827D" }}>{"// what reaches PostgreSQL"}</span>
                      </div>
                      <div>
                        … where: {"{"} status:{" "}
                        <span style={{ color: "#F2C66D" }}>&apos;paid&apos;</span>,{" "}
                        <span className="fx-hl">
                          organizationId:{" "}
                          <span style={{ color: "#F2C66D" }}>&apos;org_acme&apos;</span>
                        </span>{" "}
                        {"}"}
                      </div>
                    </div>
                    <div className="fx-row">
                      <span className="fx-pill">
                        GET /globex/invoices/inv_77 · signed in to Acme
                      </span>
                      <span
                        className="fx-code-badge"
                        style={{ color: "#A3243A", background: "#FDECEF" }}
                      >
                        404
                      </span>
                    </div>
                  </div>
                  <div className="fx-foot">
                    <a
                      className="fx-src"
                      href="https://github.com/ashikurriyal/Multi-Tenant-SaaS/blob/main/server/src/lib/tenantPrisma.ts"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M7 17L17 7M8 7h9v9" />
                      </svg>
                      <span>server/src/lib/tenantPrisma.ts</span>
                    </a>
                    <button type="button" className="fx-next" onClick={fqNext}>
                      Next question
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
                    </button>
                  </div>
                </div>
              </>
            )}
            {fqOn1 && (
              <>
                <div className="fx-panel">
                  <span className="fx-tag">Concurrency</span>
                  <h3 className="fx-h">Can a burst of requests go over the limit?</h3>
                  <p className="fx-a">
                    No. The increment and the limit check are a single PostgreSQL statement, so
                    parallel requests can’t race past the limit. If the row doesn’t come back, the
                    request gets a 429.
                  </p>
                  <div className="fx-vis">
                    <div className="fx-code">
                      <div>
                        <span style={{ color: "#5FD3B5" }}>INSERT INTO</span> usage_counters (…){" "}
                        <span style={{ color: "#5FD3B5" }}>SELECT</span> …
                      </div>
                      <div>
                        <span style={{ color: "#5FD3B5" }}>ON CONFLICT</span>{" "}
                        (&quot;organizationId&quot;, &quot;periodStart&quot;){" "}
                        <span style={{ color: "#5FD3B5" }}>DO UPDATE</span>
                      </div>
                      <div>
                        {" "}
                        <span style={{ color: "#5FD3B5" }}>SET</span> units = units + EXCLUDED.units
                      </div>
                      <div className="fx-hl-line">
                        {" "}
                        <span style={{ color: "#5FD3B5" }}>WHERE</span> units + EXCLUDED.units &lt;={" "}
                        <span style={{ color: "#F2C66D" }}>limit</span>
                      </div>
                      <div>
                        <span style={{ color: "#5FD3B5" }}>RETURNING</span> units;{" "}
                        <span style={{ color: "#6F827D" }}>-- no row back → 429</span>
                      </div>
                    </div>
                    <div className="fx-row">
                      <span className="fx-stat">
                        <b>50</b> parallel requests
                      </span>
                      <span className="fx-stat">
                        <b>33</b> accepted
                      </span>
                      <span className="fx-stat">
                        <b>990</b> / 1,000 units
                      </span>
                    </div>
                  </div>
                  <div className="fx-foot">
                    <a
                      className="fx-src"
                      href="https://github.com/ashikurriyal/Multi-Tenant-SaaS/blob/main/server/src/modules/usage/usage.service.ts"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M7 17L17 7M8 7h9v9" />
                      </svg>
                      <span>server/src/modules/usage/usage.service.ts</span>
                    </a>
                    <button type="button" className="fx-next" onClick={fqNext}>
                      Next question
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
                    </button>
                  </div>
                </div>
              </>
            )}
            {fqOn2 && (
              <>
                <div className="fx-panel">
                  <span className="fx-tag">Webhooks</span>
                  <h3 className="fx-h">What if Stripe sends the same event twice?</h3>
                  <p className="fx-a">
                    Signed events land in an inbox keyed by Stripe’s event id, are claimed
                    atomically and processed exactly once. Failures retry with backoff, and a
                    nightly job reconciles with Stripe.
                  </p>
                  <div className="fx-vis">
                    <div className="fx-box">
                      <div className="fx-tl">
                        <span className="fx-tl-dot" style={{ background: "var(--lf-accent)" }} />
                        <span
                          style={{
                            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "12px",
                            color: "#0B1215",
                          }}
                        >
                          evt_1Q8x… received
                        </span>
                        <span style={{ fontSize: "12.5px", color: "#5B676E" }}>
                          signature verified, stored in the inbox
                        </span>
                      </div>
                      <div className="fx-tl">
                        <span className="fx-tl-dot" style={{ background: "var(--lf-accent)" }} />
                        <span
                          style={{
                            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "12px",
                            color: "#0B1215",
                          }}
                        >
                          evt_1Q8x… claimed
                        </span>
                        <span style={{ fontSize: "12.5px", color: "#5B676E" }}>
                          one worker wins the atomic claim
                        </span>
                      </div>
                      <div className="fx-tl">
                        <span className="fx-tl-dot" style={{ background: "var(--lf-accent)" }} />
                        <span
                          style={{
                            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "12px",
                            color: "#0B1215",
                          }}
                        >
                          evt_1Q8x… processed
                        </span>
                        <span style={{ fontSize: "12.5px", color: "#5B676E" }}>
                          subscription and invoice updated
                        </span>
                      </div>
                      <div className="fx-tl">
                        <span className="fx-tl-dot" style={{ background: "#B7C2BF" }} />
                        <span
                          style={{
                            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "12px",
                            color: "#0B1215",
                          }}
                        >
                          evt_1Q8x… again
                        </span>
                        <span style={{ fontSize: "12.5px", color: "#5B676E" }}>
                          already in the inbox · skipped
                        </span>
                      </div>
                    </div>
                    <div className="fx-row">
                      <span style={{ fontSize: "12.5px", color: "#5B676E" }}>
                        On failure, retry after
                      </span>
                      <span className="fx-chip">2 min</span>
                      <span className="fx-chip">4 min</span>
                      <span className="fx-chip">8 min</span>
                      <span className="fx-chip">16 min</span>
                    </div>
                  </div>
                  <div className="fx-foot">
                    <a
                      className="fx-src"
                      href="https://github.com/ashikurriyal/Multi-Tenant-SaaS/blob/main/server/src/modules/webhook/webhook.processor.ts"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M7 17L17 7M8 7h9v9" />
                      </svg>
                      <span>server/src/modules/webhook/webhook.processor.ts</span>
                    </a>
                    <button type="button" className="fx-next" onClick={fqNext}>
                      Next question
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
                    </button>
                  </div>
                </div>
              </>
            )}
            {fqOn3 && (
              <>
                <div className="fx-panel">
                  <span className="fx-tag">Plan changes</span>
                  <h3 className="fx-h">How do upgrades and downgrades work?</h3>
                  <p className="fx-a">
                    You see Stripe’s exact proration first. The change goes out with an idempotency
                    key, and the plan switches only when Stripe’s webhook confirms it, so the app
                    never runs ahead of billing.
                  </p>
                  <div className="fx-vis">
                    <div className="fx-steps">
                      <div className="fx-step" style={{ "--i": "0" }}>
                        <span className="fx-node" />
                        <span>Proration preview</span>
                      </div>
                      <div className="fx-step" style={{ "--i": "1" }}>
                        <span className="fx-node" />
                        <span>You confirm</span>
                      </div>
                      <div className="fx-step" style={{ "--i": "2" }}>
                        <span className="fx-node" />
                        <span>Stripe updates</span>
                      </div>
                      <div className="fx-step" style={{ "--i": "3" }}>
                        <span className="fx-node" />
                        <span>Webhook confirms</span>
                      </div>
                      <div className="fx-step" style={{ "--i": "4" }}>
                        <span className="fx-node" />
                        <span>Plan active</span>
                      </div>
                    </div>
                    <div className="fx-row">
                      <span className="fx-pill">
                        POST …/billing/change-plan → <b style={{ color: "#8A3F06" }}>pending</b>{" "}
                        until Stripe confirms
                      </span>
                    </div>
                  </div>
                  <div className="fx-foot">
                    <a
                      className="fx-src"
                      href="https://github.com/ashikurriyal/Multi-Tenant-SaaS/blob/main/server/src/modules/billing/billing.service.ts"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M7 17L17 7M8 7h9v9" />
                      </svg>
                      <span>server/src/modules/billing/billing.service.ts</span>
                    </a>
                    <button type="button" className="fx-next" onClick={fqNext}>
                      Next question
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
                    </button>
                  </div>
                </div>
              </>
            )}
            {fqOn4 && (
              <>
                <div className="fx-panel">
                  <span className="fx-tag">Overage</span>
                  <h3 className="fx-h">How is usage beyond the plan billed?</h3>
                  <p className="fx-a">
                    Paid plans keep accepting usage past the included units. A scheduled job reports
                    it to a Stripe meter, and Stripe bills only the excess on the next invoice.
                  </p>
                  <div className="fx-vis">
                    <div className="fx-rcpt">
                      <div className="fx-rcpt-row">
                        <span>Units this period</span>
                        <span>62,000</span>
                      </div>
                      <div className="fx-rcpt-row">
                        <span>Included in Pro</span>
                        <span>− 50,000</span>
                      </div>
                      <div className="fx-rcpt-row">
                        <span>Extra units</span>
                        <span>12,000 × $0.002</span>
                      </div>
                      <div className="fx-rcpt-row strong">
                        <span>Overage on the next invoice</span>
                        <span>$24.00</span>
                      </div>
                    </div>
                    <div className="fx-row">
                      <span className="fx-pill">
                        Each event reaches Stripe’s meter once, under its own identifier
                      </span>
                    </div>
                  </div>
                  <div className="fx-foot">
                    <a
                      className="fx-src"
                      href="https://github.com/ashikurriyal/Multi-Tenant-SaaS/blob/main/server/src/jobs/reportUsage.ts"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M7 17L17 7M8 7h9v9" />
                      </svg>
                      <span>server/src/jobs/reportUsage.ts</span>
                    </a>
                    <button type="button" className="fx-next" onClick={fqNext}>
                      Next question
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
                    </button>
                  </div>
                </div>
              </>
            )}
            {fqOn5 && (
              <>
                <div className="fx-panel">
                  <span className="fx-tag">Failed payments</span>
                  <h3 className="fx-h">What happens when a payment fails?</h3>
                  <p className="fx-a">
                    Nothing breaks on day one. The workspace keeps full access for seven days while
                    owners and billing members are emailed. After that, Free limits apply until the
                    invoice is paid.
                  </p>
                  <div className="fx-vis">
                    <div className="fx-grace">
                      <span className="fx-day d0" style={{ "--i": "0" }}>
                        <i />
                        <em>Day 0</em>
                      </span>
                      <span className="fx-day" style={{ "--i": "1" }}>
                        <i />
                        <em>Day 1</em>
                      </span>
                      <span className="fx-day" style={{ "--i": "2" }}>
                        <i />
                        <em>Day 2</em>
                      </span>
                      <span className="fx-day" style={{ "--i": "3" }}>
                        <i />
                        <em>Day 3</em>
                      </span>
                      <span className="fx-day" style={{ "--i": "4" }}>
                        <i />
                        <em>Day 4</em>
                      </span>
                      <span className="fx-day" style={{ "--i": "5" }}>
                        <i />
                        <em>Day 5</em>
                      </span>
                      <span className="fx-day" style={{ "--i": "6" }}>
                        <i />
                        <em>Day 6</em>
                      </span>
                      <span className="fx-day d7" style={{ "--i": "7" }}>
                        <i />
                        <em>Day 7</em>
                      </span>
                    </div>
                    <div className="fx-row" style={{ justifyContent: "space-between" }}>
                      <span className="fx-pill">Day 0 · email and banner</span>
                      <span className="fx-pill">Days 1–6 · full access</span>
                      <span className="fx-pill" style={{ color: "#A3243A" }}>
                        Day 7 · Free limits
                      </span>
                    </div>
                  </div>
                  <div className="fx-foot">
                    <a
                      className="fx-src"
                      href="https://github.com/ashikurriyal/Multi-Tenant-SaaS/blob/main/server/src/shared/subscriptionState.ts"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M7 17L17 7M8 7h9v9" />
                      </svg>
                      <span>server/src/shared/subscriptionState.ts</span>
                    </a>
                    <button type="button" className="fx-next" onClick={fqNext}>
                      Next question
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
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
