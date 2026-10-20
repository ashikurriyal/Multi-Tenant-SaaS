"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { ExternalIcon, GitHubIcon, UpIcon } from "./icons";
import LiveDot from "./LiveDot";
import { focusRing } from "./ui";

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
    <footer className="bg-footer relative isolate overflow-hidden">
      {/* Glow under the top edge */}
      <div
        aria-hidden
        className="bg-footer-glow pointer-events-none absolute -top-px left-1/2 h-22.5 w-[min(760px,90%)] -translate-x-1/2 motion-safe:animate-breathe"
      />
      {/* Top edge, with a light sweeping along it */}
      <div aria-hidden className="bg-footer-edge relative h-0.5">
        <span className="bg-footer-haze pointer-events-none absolute top-0.5 -left-65 h-8.5 w-75 blur-[6px] motion-safe:animate-sweep" />
        <span className="bg-footer-comet pointer-events-none absolute -top-px -left-65 h-1 w-60 rounded-full motion-safe:animate-sweep" />
      </div>

      <div className="mx-auto flex max-w-300 flex-wrap items-center justify-between gap-x-6 gap-y-3.5 px-6 py-5.5 max-[760px]:justify-center max-[760px]:text-center">
        <div className="inline-flex items-center gap-2.75">
          <a
            href="#top"
            aria-label="LedgerFlow, back to top"
            className={cn(
              "inline-flex rounded-[9px] transition-transform duration-350 ease-[cubic-bezier(0.3,1.4,0.4,1)] hover:scale-106 hover:-rotate-8",
              focusRing,
            )}
          >
            <LogoMark size={30} />
          </a>
          <span className="flex flex-col gap-1">
            <span className="text-[14.5px] leading-none font-semibold text-ink">
              LedgerFlow <span className="font-normal text-faint">© 2026</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12.5px] leading-none text-subtle">
              Built by{" "}
              <a
                href="https://github.com/ashikurriyal"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group/me relative -mx-1.75 -my-0.75 inline-flex items-center gap-1.25 rounded-[7px] px-1.75 py-0.75 font-semibold text-brand-deep no-underline transition-colors duration-250 hover:bg-primary/10 hover:text-brand-deep",
                  focusRing,
                )}
              >
                <GitHubIcon />
                <span className="bg-linear-to-r from-primary to-mint bg-size-[0%_1.5px] bg-bottom-left bg-no-repeat pb-0.5 transition-[background-size] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover/me:bg-size-[100%_1.5px]">
                  @ashikurriyal
                </span>
                <ExternalIcon
                  size={11}
                  className="opacity-50 transition-[opacity,translate] duration-250 group-hover/me:translate-x-0.5 group-hover/me:-translate-y-0.5 group-hover/me:opacity-100"
                />
                <span className="sr-only"> (GitHub profile, opens in a new tab)</span>
              </a>
            </span>
          </span>
        </div>

        <span className="inline-flex min-h-8.5 flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full border border-line bg-white px-3.5 py-1.5 font-mono text-[12px] text-ink-soft shadow-[0_6px_16px_-12px_rgba(11,18,21,0.3)]">
          <LiveDot className="size-1.75" />
          <span>
            Demo data resets{" "}
            {resetIn ? (
              <>
                in <b className="font-semibold text-brand-deep tabular-nums">{resetIn}</b>
              </>
            ) : (
              "nightly"
            )}
          </span>
          <span aria-hidden className="h-3 w-px bg-frame" />
          <span className="text-faint">03:15 UTC daily</span>
          <span aria-hidden className="h-3 w-px bg-frame" />
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-1.5 rounded-full bg-[#e8b04b]" />
            Stripe test mode
          </span>
        </span>

        <a
          href="#top"
          className={cn(
            "group/up inline-flex items-center gap-2.5 rounded-full border border-line bg-white py-1 pr-1 pl-3 text-[13px] font-medium text-ink no-underline transition-[border-color,box-shadow] duration-250 hover:border-primary/45 hover:text-ink hover:shadow-[0_8px_18px_-12px_color-mix(in_srgb,var(--color-primary)_80%,transparent)]",
            focusRing,
          )}
        >
          Back to top
          <span className="inline-flex size-6.5 items-center justify-center rounded-full bg-[#f2f5f4] text-ink transition-colors duration-250 group-hover/up:bg-primary group-hover/up:text-white">
            <UpIcon className="transition-transform duration-250 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-safe:group-hover/up:-translate-y-0.75" />
          </span>
        </a>
      </div>
    </footer>
  );
}
