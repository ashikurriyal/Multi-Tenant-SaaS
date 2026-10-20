import { cn } from "@/lib/utils";
import ButtonLink from "./ButtonLink";
import HeroWalkthrough from "./HeroWalkthrough";
import LiveDot from "./LiveDot";

// The hero: a spotlight beam over the headline and the scripted product walkthrough

// Drifting specks of light inside the beam: [left, top, delay, duration]
const MOTES: [string, string, string, string][] = [
  ["left-[46%]", "top-55", "0s", "9s"],
  ["left-[53%]", "top-75", "2.5s", "11s"],
  ["left-[49%]", "top-105", "1.2s", "10s"],
  ["left-[56%]", "top-45", "4s", "12s"],
  ["left-[44%]", "top-90", "5.5s", "9.5s"],
  ["left-[51%]", "top-125", "3.2s", "13s"],
  ["left-[58%]", "top-100", "6.5s", "10.5s"],
  ["left-[41%]", "top-70", "7.5s", "11.5s"],
  ["left-[61%]", "top-62.5", "1.8s", "12.5s"],
];

// The headline block fades up line by line on load
const enter = "motion-safe:animate-enter";
const DELAY = {
  d1: "motion-safe:[animation-delay:80ms]",
  d2: "motion-safe:[animation-delay:180ms]",
  d3: "motion-safe:[animation-delay:300ms]",
  d4: "motion-safe:[animation-delay:450ms]",
};

export default function Hero() {
  return (
    <section
      id="top"
      className="pause-when-off relative isolate overflow-hidden bg-[radial-gradient(1200px_600px_at_50%_-10%,color-mix(in_srgb,var(--color-primary)_6%,#FFFFFF),#FFFFFF_70%)]"
    >
      {/* The navbar turns into a floating pill once this marker scrolls out of view */}
      <div
        data-lf="navsentinel"
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 h-12 w-px"
      />
      <Spotlight />
      <div className="relative z-1 mx-auto flex max-w-300 flex-col items-center gap-6 px-6 pt-33 pb-10 text-center">
        <p
          className={cn(
            enter,
            DELAY.d1,
            "inline-flex items-center gap-2 rounded-full border border-frame bg-white px-3.5 py-1.5 text-[14px] text-ink-soft",
          )}
        >
          <LiveDot /> Live demo on Stripe test mode · no card, no sign-up{" "}
        </p>
        <h1
          className={cn(
            enter,
            DELAY.d2,
            "max-w-235 text-[clamp(38px,5.2vw,68px)] leading-[1.04] font-[650] tracking-[-0.035em]",
          )}
        >
          Subscriptions, usage billing and revenue analytics for SaaS teams
        </h1>
        <p className={cn(enter, DELAY.d3, "max-w-170 text-[19px] leading-[1.55] text-body")}>
          Multi-tenant workspaces on Stripe: plans with proration, metered usage with hard limits, a
          grace period when payments fail, and an admin view of MRR, churn and NRR. Built to stay
          correct under real concurrency.
        </p>
        <div className={cn(enter, DELAY.d4, "mt-1 flex flex-wrap justify-center gap-3")}>
          <ButtonLink
            href="/login"
            shine
            arrow
            className="min-h-12 rounded-[12px] px-5.5 py-3.5 text-[16px] font-medium"
          >
            Try the live demo{" "}
          </ButtonLink>
          <ButtonLink
            href="/register"
            variant="ghost"
            className="min-h-12 rounded-[12px] px-5.5 py-3.5 text-[16px] font-medium"
          >
            Create a free account
          </ButtonLink>
        </div>
        <p className={cn(enter, DELAY.d4, "text-[14px] text-subtle")}>
          Four one-click demo accounts: Pro, Billing user, Past due, Free near its limit
        </p>
      </div>
      <div className={cn(enter, DELAY.d4, "relative z-1 mx-auto max-w-280 px-6 pt-6 pb-24")}>
        <HeroWalkthrough />
      </div>
    </section>
  );
}

// The light falling on the headline; it sways slowly and leans toward the cursor (--tilt)
function Spotlight() {
  const side = "absolute -top-15 h-225 w-275 blur-[30px] will-change-transform";
  return (
    <div data-lf="herobg" aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <div
        className={cn(
          side,
          "bg-spot-side-left -left-65 origin-[23.6%_0] motion-safe:animate-spot-left",
        )}
      />
      <div
        className={cn(
          side,
          "bg-spot-side-right -right-65 origin-[76.4%_0] motion-safe:animate-spot-right",
        )}
      />
      <div className="absolute -top-10 left-1/2 -ml-300 h-250 w-600 origin-[50%_0] rotate-(--tilt,0deg) transition-[rotate] duration-1200 ease-[cubic-bezier(0.2,0.7,0.2,1)] will-change-transform motion-safe:animate-spot-aim">
        <div className="bg-spot-beam absolute inset-0 origin-[50%_0] blur-[26px]" />
        <div className="mask-spot-cone absolute inset-0 origin-[50%_0]">
          <div className="bg-spot-rays absolute inset-0 opacity-85 blur-[1.5px]" />
          <div className="bg-spot-grid absolute inset-0" />
        </div>
      </div>
      <div className="bg-spot-flare absolute -top-0.75 left-1/2 -ml-200 h-2.5 w-400 rounded-full blur-[3px] will-change-[opacity,transform] motion-safe:animate-spot-flare" />
      <div className="bg-spot-lamp absolute -top-px left-1/2 -ml-95 h-0.5 w-190 rounded-full will-change-[opacity,transform] motion-safe:animate-spot-breath" />
      <div className="absolute inset-0">
        {MOTES.map(([left, top, delay, duration]) => (
          <i
            key={left + top}
            style={{ animationDelay: delay, animationDuration: duration }}
            className={cn(
              "absolute size-0.75 rounded-full bg-mint opacity-0 shadow-[0_0_8px_2px_rgba(95,211,181,0.6)] motion-safe:animate-mote",
              left,
              top,
            )}
          />
        ))}
      </div>
      <div className="bg-spot-pool absolute top-125 left-1/2 -ml-187.5 h-85 w-375 rounded-full blur-[30px] will-change-[opacity,transform] motion-safe:animate-spot-breath" />
    </div>
  );
}
