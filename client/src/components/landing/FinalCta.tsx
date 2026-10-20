import Link from "next/link";
import { cn } from "@/lib/utils";
import ButtonLink from "./ButtonLink";
import CardStack from "./CardStack";
import LiveDot from "./LiveDot";
import { reveal } from "./ui";

// The closing call to action: a dark panel, a fanned stack of demo accounts and an
// event ticker

const STEPS = ["Pick an account", "Explore billing and usage", "Upgrade with 4242…"];

const EVENTS = [
  { tag: "202", color: "text-mint", text: "usage recorded · +25" },
  { tag: "evt", color: "text-sky", text: "invoice.paid" },
  { tag: "202", color: "text-mint", text: "usage recorded · +10" },
  { tag: "plan", color: "text-lime", text: "acme → business" },
  { tag: "429", color: "text-gold", text: "PLAN_LIMIT_USAGE" },
  { tag: "evt", color: "text-sky", text: "customer.subscription.updated" },
  { tag: "202", color: "text-mint", text: "usage recorded · +40" },
  { tag: "mrr", color: "text-lime", text: "snapshot saved · $2,376" },
  { tag: "evt", color: "text-[#F49AA9]", text: "invoice.payment_failed" },
  { tag: "202", color: "text-mint", text: "duplicate · not counted" },
];

export default function FinalCta() {
  return (
    <section className="mx-auto max-w-300 px-6 pt-2 pb-24">
      <div
        className={cn(
          reveal,
          "relative isolate overflow-hidden rounded-[28px] border border-night-line bg-ink text-cloud shadow-[0_40px_80px_-48px_rgba(11,18,21,0.8)]",
        )}
      >
        {/* Two drifting glows and a faint grid */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
          <span className="absolute -top-40 -right-30 h-105 w-140 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-primary)_70%,transparent),transparent)] blur-[60px] motion-safe:animate-aurora" />
          <span className="absolute -bottom-50 -left-40 h-90 w-120 rounded-full bg-[radial-gradient(closest-side,rgba(212,247,161,0.22),transparent)] blur-[60px] motion-safe:animate-[lf-aurora_20s_ease-in-out_infinite_alternate-reverse]" />
        </div>
        <div
          aria-hidden
          className="bg-grid-faint pointer-events-none absolute inset-0 -z-10 mask-[radial-gradient(ellipse_80%_90%_at_70%_40%,#000_20%,transparent_80%)]"
        />

        <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-center gap-10 px-14 pt-16 pb-12 max-[900px]:grid-cols-1 max-[900px]:px-7 max-[900px]:pt-12 max-[900px]:pb-9">
          <div className="flex min-w-0 flex-col gap-5">
            <span className="inline-flex h-7.5 items-center gap-2 self-start rounded-full border border-mint/25 bg-mint/10 px-3 text-[13px] font-medium text-[#BFEFE0]">
              <LiveDot className="size-1.75 bg-mint" />
              Live demo · Stripe test mode
            </span>
            <h2 className="text-[clamp(32px,4vw,52px)] leading-[1.04] font-[650] tracking-[-0.035em] text-white">
              See it running in
              <br />
              <span className="bg-linear-to-r from-mint from-10% to-lime to-90% bg-clip-text text-transparent">
                under a minute
              </span>
            </h2>
            <p className="max-w-115 text-[17px] leading-[1.6] text-mist">
              Open a demo account with one click, no password needed, or start your own workspace on
              the Free plan.
            </p>
            <div className="mt-1 flex flex-wrap gap-3">
              <ButtonLink
                href="/login"
                shine
                arrow
                className="min-h-12.5 rounded-[12px] bg-mint px-5.5 text-[16px] font-semibold text-ink hover:bg-[#7de3c8] hover:text-ink hover:shadow-[0_14px_34px_-12px_rgba(95,211,181,0.7)] focus-visible:outline-mint"
              >
                Try the live demo
              </ButtonLink>
              <Link
                href="/register"
                className="inline-flex min-h-12.5 items-center rounded-[12px] border border-[#2f4248] bg-white/3 px-5.5 text-[16px] font-medium text-white no-underline transition-[border-color,background-color,translate] duration-250 hover:border-mint hover:bg-mint/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-mint motion-safe:hover:-translate-y-0.5"
              >
                Create a free account
              </Link>
            </div>
            <ol className="mt-1.5 flex flex-wrap items-center gap-2">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden className="h-px w-4.5 bg-[#2a3c42]" />}
                  <span className="inline-flex items-center gap-2 text-[13.5px] text-fog">
                    <span className="inline-flex size-5.5 items-center justify-center rounded-full border border-[#2a3c42] bg-[#16242a] font-mono text-[11px] text-mint">
                      {i + 1}
                    </span>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <CardStack />
        </div>

        {/* Event ticker: the list is doubled so the loop is seamless */}
        <div
          aria-hidden
          className="group/ticker relative overflow-hidden border-t border-night-line bg-black/25 mask-[linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
        >
          <div className="flex w-max gap-2.5 px-2.5 py-3.5 motion-safe:animate-marquee motion-safe:group-hover/ticker:paused">
            {[...EVENTS, ...EVENTS].map((e, i) => (
              <span
                key={i}
                className="inline-flex h-7.5 items-center gap-2 rounded-full border border-night-line-2 bg-[#0f191c] px-3 font-mono text-[12px] whitespace-nowrap text-mist"
              >
                <b className={cn("font-semibold", e.color)}>{e.tag}</b>
                {e.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
