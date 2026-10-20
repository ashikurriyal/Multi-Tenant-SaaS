"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import ButtonLink from "./ButtonLink";
import { CheckIcon } from "./icons";
import { reveal } from "./ui";

// Pricing: the three seeded plans (server/prisma/seed.ts) and an estimator that prices a
// month's usage on each and highlights the cheapest. Monthly plans only.

// prettier-ignore
const UNIT_STOPS = [500, 1000, 5000, 10000, 25000, 50000, 75000, 100000, 125000, 150000, 250000, 500000, 750000, 1000000];
type PlanKey = "free" | "pro" | "biz";

const usd = (v: number) =>
  "$" +
  (Number.isInteger(v)
    ? v.toLocaleString("en-US")
    : v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

// Free stops at its limit (429), so it has no price above 1,000 units
const planCosts = (u: number): Record<PlanKey, number | null> => ({
  free: u <= 1000 ? 0 : null,
  pro: 49 + Math.max(0, u - 50000) * 0.002,
  biz: 199 + Math.max(0, u - 500000) * 0.001,
});

type Plan = {
  key: PlanKey;
  name: string;
  blurb: string;
  price: string;
  cta: string;
  featured?: boolean;
  icon: React.ReactNode;
  features: { text: React.ReactNode; included?: false }[];
};

const PLANS: Plan[] = [
  {
    key: "free",
    name: "Free",
    blurb: "For trying LedgerFlow and small side projects.",
    price: "$0",
    cta: "Start free",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    features: [
      { text: "3 seats" },
      { text: "1,000 units a month" },
      { text: "Hard limit: new usage gets a 429" },
      { text: "API keys, roles and the audit log" },
      { text: "No overage billing", included: false },
    ],
  },
  {
    key: "pro",
    name: "Pro",
    blurb: "For growing teams with steady usage.",
    price: "$49",
    cta: "Choose Pro",
    featured: true,
    icon: <path d="M13 2L3 14h9l-1 8 10-12h-9z" />,
    features: [
      { text: "10 seats" },
      { text: "50,000 units a month included" },
      {
        text: (
          <>
            <b className="font-semibold">$0.002</b> per extra unit, billed by Stripe’s meter
          </>
        ),
      },
      { text: "Plan changes with exact proration" },
      { text: "Stripe Customer Portal for cards and invoices" },
    ],
  },
  {
    key: "biz",
    name: "Business",
    blurb: "For high-volume products and larger teams.",
    price: "$199",
    cta: "Choose Business",
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
    features: [
      { text: "50 seats" },
      { text: "500,000 units a month included" },
      {
        text: (
          <>
            <b className="font-semibold">$0.001</b> per extra unit, billed by Stripe’s meter
          </>
        ),
      },
      { text: "Everything in Pro" },
      { text: "Cheapest above 125,000 units a month" },
    ],
  },
];

const FOOTNOTES = [
  "Change plans any time, prorated by Stripe",
  "A 7-day grace period if a payment fails",
  "Usage resets every billing period",
];

export default function Pricing() {
  const [unitsIdx, setUnitsIdx] = useState(7);
  const units = UNIT_STOPS[unitsIdx];
  const costs = planCosts(units);
  const best = (Object.entries(costs) as [PlanKey, number | null][])
    .filter((e): e is [PlanKey, number] => e[1] !== null)
    .reduce((a, b) => (b[1] < a[1] ? b : a))[0];
  const unitsMax = UNIT_STOPS.length - 1;
  const unitsText = units.toLocaleString("en-US");

  return (
    <section
      id="pricing"
      className="relative isolate overflow-hidden border-y border-divider bg-surface"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-55 left-1/2 -z-10 h-130 w-225 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-primary)_14%,transparent),transparent)]"
      />
      <div className="mx-auto max-w-300 px-6 py-24">
        <div className={cn(reveal, "flex flex-col items-center gap-3 text-center")}>
          <p className="text-[14px] font-semibold tracking-[0.08em] text-primary uppercase">
            Pricing
          </p>
          <h2 className="text-[clamp(30px,3.4vw,44px)] leading-[1.1] font-[650] tracking-tight">
            Start free. Pay for what you use.
          </h2>
          <p className="max-w-155 text-[17px] leading-[1.6] text-body">
            Monthly plans with included units. Paid plans keep working past the included amount and
            bill the extra through Stripe.
          </p>
          <span className="mt-1 inline-flex h-8 items-center gap-2 rounded-full border border-line bg-white px-3 text-[13.5px] text-ink-soft">
            <span className="rounded-[5px] bg-[#FEF3C7] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#8A3F06]">
              TEST MODE
            </span>
            Pay with card <span className="font-mono">4242 4242 4242 4242</span>
          </span>
        </div>

        <div
          className={cn(
            reveal,
            "mx-auto mt-11 mb-9 flex max-w-190 flex-col gap-3.5 rounded-[16px] border border-line bg-white px-5.5 py-5 shadow-[0_12px_30px_-24px_rgba(11,18,21,0.3)]",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5">
            <label className="flex flex-col gap-1" htmlFor="lf-units">
              <span className="text-[15px] font-semibold">Estimate your bill</span>
              <span className="text-[13.5px] text-subtle">
                Drag to set how many units you report a month
              </span>
            </label>
            <span className="inline-flex h-8.5 items-baseline gap-1.5 rounded-[10px] border border-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-line))] bg-primary/8 px-3 text-[13.5px] leading-8.5 text-brand-deep">
              <b className="text-[16px] font-[650] tabular-nums">{unitsText}</b> units / month
            </span>
          </div>
          <input
            id="lf-units"
            type="range"
            min="0"
            max={unitsMax}
            step="1"
            value={unitsIdx}
            onChange={(e) => setUnitsIdx(Number(e.target.value))}
            aria-valuetext={`${unitsText} units a month`}
            style={{ "--p": `${Math.round((unitsIdx / unitsMax) * 1000) / 10}%` }}
            className="range-brand my-1.5 h-2 w-full cursor-pointer rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-primary"
          />
          <div className="flex justify-between font-mono text-[11.5px] text-faint">
            {["500", "50K", "125K", "500K", "1M"].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 items-stretch gap-5 max-[960px]:mx-auto max-[960px]:max-w-130 max-[960px]:grid-cols-1">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              best={plan.key === best}
              unitsText={unitsText}
              cost={costs[plan.key]}
            />
          ))}
        </div>

        <div
          className={cn(
            reveal,
            "mt-8 flex flex-wrap justify-center gap-x-5.5 gap-y-2 text-[14px] text-body",
          )}
        >
          {FOOTNOTES.map((note) => (
            <span key={note} className="inline-flex items-center gap-2">
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              {note}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  best,
  unitsText,
  cost,
}: {
  plan: Plan;
  best: boolean;
  unitsText: string;
  cost: number | null;
}) {
  return (
    <article
      data-best={best}
      className={cn(
        reveal,
        "group relative flex flex-col gap-4 rounded-[20px] border border-line bg-white p-7",
        "shadow-[0_1px_2px_rgba(11,18,21,0.04),0_14px_30px_-24px_rgba(11,18,21,0.25)] transition-[translate,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
        "hover:border-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-line))] hover:shadow-[0_24px_48px_-28px_color-mix(in_srgb,var(--color-primary)_60%,rgba(11,18,21,0.4))] motion-safe:hover:-translate-y-1",
        plan.featured &&
          "bg-plan-featured shadow-[0_30px_60px_-34px_color-mix(in_srgb,var(--color-primary)_70%,transparent)]",
        "data-[best=true]:border-primary data-[best=true]:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_22%,transparent),0_26px_52px_-28px_color-mix(in_srgb,var(--color-primary)_70%,transparent)]",
      )}
    >
      {/* Pops in above the cheapest plan for the chosen usage */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 inline-flex h-6.5 -translate-1/2 scale-90 items-center rounded-full bg-ink px-3 text-[12px] font-semibold whitespace-nowrap text-white opacity-0 shadow-[0_8px_18px_-8px_rgba(11,18,21,0.5)] transition-[opacity,scale] duration-300 ease-[cubic-bezier(0.3,1.4,0.4,1)] group-data-[best=true]:scale-100 group-data-[best=true]:opacity-100"
      >
        Best fit for {unitsText} units
      </span>

      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2.5">
          <span
            className={cn(
              "inline-flex size-8.5 items-center justify-center rounded-[10px] border border-primary/25 bg-primary/10 text-primary transition-colors duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-white",
              plan.featured && "border-primary bg-primary text-white",
            )}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {plan.icon}
            </svg>
          </span>
          <h3 className="text-[19px] font-semibold">{plan.name}</h3>
        </span>
        {plan.featured && (
          <span className="rounded-full bg-primary px-2.5 py-1 text-[12.5px] font-semibold text-white">
            Most teams
          </span>
        )}
      </div>
      <p className="text-[14.5px] leading-normal text-subtle">{plan.blurb}</p>
      <p className="mt-0.5 flex items-baseline gap-1.5">
        <span className="text-[46px] leading-none font-[650] tracking-[-0.035em]">
          {plan.price}
        </span>
        <span className="text-[15px] text-subtle">/ month</span>
      </p>
      <div className="flex items-center justify-between gap-2.5 rounded-[10px] border border-line-soft bg-surface px-3 py-2.5 text-[13px] text-subtle">
        <span>At {unitsText} units</span>
        <b
          className={cn(
            "text-[14px] font-[650] tabular-nums transition-colors duration-200",
            cost === null ? "text-[#B42C22]" : best ? "text-brand-deep" : "text-ink",
          )}
        >
          {cost === null ? "Over the limit" : `${usd(cost)} / mo`}
        </b>
      </div>
      <ButtonLink
        href="/register"
        variant={plan.featured ? "primary" : "ghost"}
        arrow
        className="min-h-12 rounded-[12px] px-4 text-[15px] font-medium"
      >
        {plan.cta}
      </ButtonLink>
      <ul className="mt-1 flex flex-col gap-2.75 border-t border-dashed border-frame pt-4 text-[14.5px] leading-[1.45] text-ink-soft">
        {plan.features.map((f, i) => (
          <li
            key={i}
            className={cn("flex items-start gap-2.5", f.included === false && "text-faint")}
          >
            {f.included === false ? (
              <svg
                className="mt-0.75 flex-none text-[#B7C2BF]"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M6 12h12" />
              </svg>
            ) : (
              <CheckIcon className="mt-0.75 flex-none text-primary" />
            )}
            <span>{f.text}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
