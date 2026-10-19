"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { ExternalIcon, GitHubIcon, UpIcon } from "./icons";

// The demo data is rebuilt by the reset-demo job, scheduled daily at 03:15 UTC in
// .github/workflows/scheduled-jobs.yml. Keep the two in step.
const RESET_UTC = { h: 3, m: 15 };

function untilReset(now: Date) {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), RESET_UTC.h, RESET_UTC.m),
  );
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  const mins = Math.ceil((next.getTime() - now.getTime()) / 60000);
  const h = Math.floor(mins / 60);
  return h ? `${h}h ${mins % 60}m` : `${mins}m`;
}

export default function LandingFooter() {
  // Computed in the browser only: the page itself is prerendered
  const [resetIn, setResetIn] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setResetIn(untilReset(new Date()));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="ftr">
      <div className="ftr-line" aria-hidden="true" />
      <div className="ft">
        <div className="ft-brand">
          <a href="#top" className="ft-logo" aria-label="LedgerFlow, back to top">
            <LogoMark size={30} />
          </a>
          <span className="ft-lines">
            <span className="ft-name">
              LedgerFlow <span>© 2026</span>
            </span>
            <span className="ft-by">
              Built by{" "}
              <a
                className="ft-me"
                href="https://github.com/ashikurriyal"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubIcon />
                <span className="ft-me-name">@ashikurriyal</span>
                <ExternalIcon size={11} className="ft-me-arrow" />
                <span className="sr-only"> (GitHub profile, opens in a new tab)</span>
              </a>
            </span>
          </span>
        </div>
        <span className="ft-status">
          <span className="ping ft-dot" />
          <span>
            Demo data resets{" "}
            {resetIn ? (
              <>
                in <b>{resetIn}</b>
              </>
            ) : (
              "nightly"
            )}
          </span>
          <span className="ft-sep" aria-hidden="true" />
          <span style={{ color: "#7D8B87" }}>03:15 UTC daily</span>
          <span className="ft-sep" aria-hidden="true" />
          <span className="ft-test">Stripe test mode</span>
        </span>
        <a className="ft-up" href="#top">
          Back to top
          <span className="ft-up-ic">
            <UpIcon />
          </span>
        </a>
      </div>
    </footer>
  );
}
