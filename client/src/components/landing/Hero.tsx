import Link from "next/link";
import HeroWalkthrough from "./HeroWalkthrough";

// The hero: a spotlight beam over the headline and the scripted product walkthrough
export default function Hero() {
  return (
    <>
      <section
        id="top"
        style={{
          position: "relative",
          overflow: "hidden",
          isolation: "isolate",
          background:
            "radial-gradient(1200px 600px at 50% -10%, color-mix(in srgb, var(--lf-accent) 6%, #FFFFFF), #FFFFFF 70%)",
        }}
      >
        <div
          data-lf="navsentinel"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            width: "1px",
            height: "48px",
            pointerEvents: "none",
          }}
        />
        <div
          className="hero-bg"
          data-lf="herobg"
          aria-hidden="true"
          style={{ position: "absolute", inset: "0", zIndex: "0", pointerEvents: "none" }}
        >
          <div className="sp-side sl" />
          <div className="sp-side sr" />
          <div className="sp-aim">
            <div className="sp-beam" />
            <div className="sp-cone">
              <div className="sp-rays" />
              <div className="sp-grid" />
            </div>
          </div>
          <div className="sp-flare" />
          <div className="sp-lamp" />
          <div className="sp-motes">
            <i
              style={{ left: "46%", top: "220px", animationDelay: "0s", animationDuration: "9s" }}
            />
            <i
              style={{
                left: "53%",
                top: "300px",
                animationDelay: "2.5s",
                animationDuration: "11s",
              }}
            />
            <i
              style={{
                left: "49%",
                top: "420px",
                animationDelay: "1.2s",
                animationDuration: "10s",
              }}
            />
            <i
              style={{ left: "56%", top: "180px", animationDelay: "4s", animationDuration: "12s" }}
            />
            <i
              style={{
                left: "44%",
                top: "360px",
                animationDelay: "5.5s",
                animationDuration: "9.5s",
              }}
            />
            <i
              style={{
                left: "51%",
                top: "500px",
                animationDelay: "3.2s",
                animationDuration: "13s",
              }}
            />
            <i
              style={{
                left: "58%",
                top: "400px",
                animationDelay: "6.5s",
                animationDuration: "10.5s",
              }}
            />
            <i
              style={{
                left: "41%",
                top: "280px",
                animationDelay: "7.5s",
                animationDuration: "11.5s",
              }}
            />
            <i
              style={{
                left: "61%",
                top: "250px",
                animationDelay: "1.8s",
                animationDuration: "12.5s",
              }}
            />
          </div>
          <div className="sp-pool" />
        </div>
        <div
          style={{
            position: "relative",
            zIndex: "1",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "132px 24px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "24px",
          }}
        >
          <p
            className="in d1"
            style={{
              margin: "0",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              color: "#2F3B42",
              background: "#FFFFFF",
              border: "1px solid #DCE3E1",
              borderRadius: "999px",
              padding: "6px 14px",
            }}
          >
            <span
              className="ping"
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "999px",
                background: "var(--lf-accent)",
              }}
            />{" "}
            Live demo on Stripe test mode · no card, no sign-up{" "}
          </p>
          <h1
            className="in d2"
            style={{
              margin: "0",
              maxWidth: "940px",
              fontSize: "clamp(38px, 5.2vw, 68px)",
              lineHeight: "1.04",
              letterSpacing: "-0.035em",
              fontWeight: "650",
            }}
          >
            Subscriptions, usage billing and revenue analytics for SaaS teams
          </h1>
          <p
            className="in d3"
            style={{
              margin: "0",
              maxWidth: "680px",
              fontSize: "19px",
              lineHeight: "1.55",
              color: "#46535A",
            }}
          >
            Multi-tenant workspaces on Stripe: plans with proration, metered usage with hard limits,
            a grace period when payments fail, and an admin view of MRR, churn and NRR. Built to
            stay correct under real concurrency.
          </p>
          <div
            className="in d4"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "12px",
              marginTop: "4px",
            }}
          >
            <Link
              className="btn-primary cta-shine"
              href="/login"
              style={{
                fontSize: "16px",
                fontWeight: "500",
                textDecoration: "none",
                color: "#FFFFFF",
                background: "var(--lf-accent)",
                padding: "14px 22px",
                borderRadius: "12px",
                minHeight: "48px",
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Try the live demo{" "}
              <svg
                className="btn-arrow"
                width="16"
                height="16"
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
            </Link>
            <Link
              className="btn-ghost"
              href="/register"
              style={{
                fontSize: "16px",
                fontWeight: "500",
                textDecoration: "none",
                color: "#0B1215",
                background: "#FFFFFF",
                border: "1px solid #D4DCDA",
                padding: "14px 22px",
                borderRadius: "12px",
                minHeight: "48px",
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Create a free account
            </Link>
          </div>
          <p className="in d4" style={{ margin: "0", fontSize: "14px", color: "#5B676E" }}>
            Four one-click demo accounts: Pro, Billing user, Past due, Free near its limit
          </p>
        </div>
        <div
          className="in d4"
          style={{
            position: "relative",
            zIndex: "1",
            maxWidth: "1120px",
            margin: "0 auto",
            padding: "24px 24px 96px",
          }}
        >
          <HeroWalkthrough />
        </div>
      </section>
    </>
  );
}
