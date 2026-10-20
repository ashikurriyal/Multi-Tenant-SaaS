import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowIcon } from "./icons";
import SectionHeader from "./SectionHeader";
import { reveal } from "./ui";

// "Try it": the four one-click demo accounts on the login page

type Strip =
  | { kind: "meter"; label: string; value: string; pct: number; color: string }
  | { kind: "perms"; allowed: string[]; denied: string[] }
  | { kind: "grace"; days: number };

type Account = {
  initials: string;
  avatar: string; // avatar background
  tone: string; // hover accent: top bar, border, glow, link color
  pill: { label: string; className: string };
  title: string;
  description: string;
  strip: Strip;
  cta: string;
};

const ACCOUNTS: Account[] = [
  {
    initials: "AC",
    avatar: "bg-ink",
    tone: "var(--color-primary)",
    pill: { label: "Pro · active", className: "bg-primary/10 text-brand-deep" },
    title: "Owner at Acme",
    description:
      "Usage at 81% with the warning banner, a plan change with Stripe’s proration preview, the billing portal.",
    strip: { kind: "meter", label: "Usage", value: "81%", pct: 81, color: "#C27C0E" },
    cta: "Log in as Acme owner",
  },
  {
    initials: "AC",
    avatar: "bg-ink",
    tone: "#4F6BED",
    pill: { label: "Role · Billing", className: "bg-[#EDF1FD] text-[#2F4FB8]" },
    title: "Billing user at Acme",
    description: "Manages the plan and invoices, but can’t manage members or API keys.",
    strip: { kind: "perms", allowed: ["Plan", "Invoices"], denied: ["Members", "API keys"] },
    cta: "Log in as Acme billing user",
  },
  {
    initials: "GL",
    avatar: "bg-[#7A2E1E]",
    tone: "#E0533F",
    pill: { label: "Past due", className: "bg-[#FCEDE8] text-[#A33A1E]" },
    title: "Owner at Globex",
    description:
      "A renewal that really failed in Stripe: the payment banner and a 7-day grace period.",
    strip: { kind: "grace", days: 7 },
    cta: "Log in as Globex owner",
  },
  {
    initials: "IN",
    avatar: "bg-ink-soft",
    tone: "#C0352B",
    pill: { label: "Free · 95%", className: "bg-line-soft text-[#3F4B52]" },
    title: "Owner at Initech",
    description:
      "Almost at the Free limit: at 100% new usage is rejected and upgrade prompts appear.",
    strip: { kind: "meter", label: "Usage", value: "950 / 1,000", pct: 95, color: "#C0352B" },
    cta: "Log in as Initech owner",
  },
];

export default function DemoCards() {
  return (
    <section id="demo" data-lf-io className="group/demo mx-auto max-w-300 px-6 py-24">
      <SectionHeader eyebrow="Try it" title="Pick a demo account. One click, no password.">
        Each one starts in a real situation, on real Stripe test subscriptions. The demo data is
        rebuilt every night.
      </SectionHeader>
      <div className="mt-11 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
        {ACCOUNTS.map((a) => (
          <DemoCard key={a.cta} account={a} />
        ))}
      </div>
    </section>
  );
}

function DemoCard({ account: a }: { account: Account }) {
  return (
    <Link
      href="/login"
      style={{ "--tone": a.tone }}
      className={cn(
        reveal,
        "group relative isolate flex flex-col gap-2.5 overflow-hidden rounded-[16px] border border-line bg-white p-5.5 text-ink no-underline shadow-[0_1px_2px_rgba(11,18,21,0.04)]",
        "transition-[translate,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
        "hover:border-[color-mix(in_srgb,var(--tone)_40%,var(--color-line))] hover:text-ink hover:shadow-[0_18px_36px_-22px_color-mix(in_srgb,var(--tone)_70%,rgba(11,18,21,0.5))] motion-safe:hover:-translate-y-1",
        "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary",
      )}
    >
      {/* Colored bar that sweeps across the top, and a soft glow in the corner, on hover */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.75 origin-left scale-x-0 bg-(--tone) transition-transform duration-450 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-x-100"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(320px_circle_at_100%_0%,color-mix(in_srgb,var(--tone)_9%,transparent),transparent_65%)] opacity-0 transition-opacity duration-350 group-hover:opacity-100"
      />

      <span className="flex items-center justify-between gap-2.5">
        <span
          className={cn(
            "inline-flex size-9 flex-none items-center justify-center rounded-[10px] text-[12.5px] font-semibold tracking-[0.02em] text-white",
            "shadow-[0_0_0_3px_#fff,0_0_0_4px_color-mix(in_srgb,var(--tone)_35%,var(--color-line))]",
            "transition-transform duration-350 ease-[cubic-bezier(0.3,1.4,0.4,1)] motion-safe:group-hover:scale-106 motion-safe:group-hover:-rotate-6",
            a.avatar,
          )}
        >
          {a.initials}
        </span>
        <span
          className={cn("rounded-full px-2.5 py-1 text-[12.5px] font-semibold", a.pill.className)}
        >
          {a.pill.label}
        </span>
      </span>
      <span className="mt-0.5 text-[18px] leading-tight font-semibold">{a.title}</span>
      <span className="text-[14.5px] leading-normal text-body">{a.description}</span>
      <StatusStrip strip={a.strip} />
      <span className="mt-auto inline-flex items-center gap-1.5 border-t border-line-soft pt-3 text-[13.5px] font-semibold text-ink transition-colors duration-250 group-hover:text-(--tone)">
        {a.cta}
        <ArrowIcon size={14} />
      </span>
    </Link>
  );
}

// The account's situation at a glance; it animates in once the section is in view
function StatusStrip({ strip }: { strip: Strip }) {
  const box =
    "mt-0.5 flex flex-col gap-[7px] rounded-[10px] border border-line-soft bg-surface px-3 py-2.5";

  if (strip.kind === "perms") {
    return (
      <div className={cn(box, "flex-row flex-wrap gap-1.5")}>
        {[
          ...strip.allowed.map((p) => [p, true] as const),
          ...strip.denied.map((p) => [p, false] as const),
        ].map(([label, ok], i) => (
          <span
            key={label}
            style={{ animationDelay: `${i * 0.1}s` }}
            className={cn(
              "inline-flex h-5.5 items-center rounded-[6px] px-2 text-[11.5px] font-medium",
              "motion-safe:group-data-[intro=pending]/demo:opacity-0 motion-safe:group-data-[intro=play]/demo:animate-slide-in",
              ok
                ? "bg-[#EDF1FD] text-[#2F4FB8]"
                : "border border-dashed border-line-strong bg-white text-faint line-through decoration-[#B7C2BF]",
            )}
          >
            {ok ? "✓" : "✕"} {label}
          </span>
        ))}
      </div>
    );
  }

  if (strip.kind === "grace") {
    return (
      <div className={box}>
        <div className="flex justify-between text-[12px]">
          <span className="text-subtle">Grace period</span>
          <span className="font-semibold text-[#B42C22]">{strip.days} days</span>
        </div>
        <span className="grid grid-cols-7 gap-1">
          {Array.from({ length: strip.days }, (_, i) => (
            <i
              key={i}
              style={{ animationDelay: i === 0 ? "0.2s, 1s" : `${0.2 + i * 0.07}s` }}
              className={cn(
                "block h-1.5 rounded-[3px]",
                "motion-safe:group-data-[intro=pending]/demo:opacity-0 motion-safe:group-data-[intro=play]/demo:animate-pop-in",
                i === 0
                  ? "bg-[#E0533F] motion-safe:group-data-[intro=play]/demo:animate-[lf-pop-in_0.3s_ease_both,lf-blink_1.6s_ease-in-out_infinite]"
                  : "bg-[color-mix(in_srgb,#E0533F_28%,#fff)]",
              )}
            />
          ))}
        </span>
      </div>
    );
  }

  return (
    <div className={box}>
      <div className="flex justify-between text-[12px]">
        <span className="text-subtle">{strip.label}</span>
        <span className="font-semibold tabular-nums" style={{ color: strip.color }}>
          {strip.value}
        </span>
      </div>
      <span className="block h-1.5 overflow-hidden rounded-full bg-[#E6ECEA]">
        <span
          className="block h-full origin-left rounded-full motion-safe:group-data-[intro=pending]/demo:scale-x-0 motion-safe:group-data-[intro=play]/demo:animate-fill"
          style={{ width: `${strip.pct}%`, background: strip.color }}
        />
      </span>
    </div>
  );
}
