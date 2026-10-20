import Image from "next/image";
import { cn } from "@/lib/utils";
import SectionHeader from "./SectionHeader";
import { reveal } from "./ui";

// "How it works": three steps from first payment to the revenue report

const STEPS = [
  {
    tags: ["Checkout", "Proration"],
    title: "Subscribe with Stripe",
    text: "Checkout for the first payment, plan changes with an exact proration preview, and the Stripe Customer Portal for cards and invoices.",
    window: {
      label: "/billing",
      image: {
        src: "/landing/billing.png",
        alt: "Billing page with the current Pro plan and plan cards",
        height: 900,
      },
    },
  },
  {
    tags: ["REST API", "Idempotent"],
    title: "Report usage from your app",
    text: "One request per event with an API key. Retries are never counted twice, and the Free limit holds even under a burst.",
    window: { label: "usage.http" },
  },
  {
    tags: ["Quotas", "Charts"],
    title: "See usage and revenue",
    text: "Usage against quota with a projection for the period, banners at 80% and 100%, and daily charts for any range.",
    window: {
      label: "/usage",
      image: {
        src: "/landing/usage.png",
        alt: "Usage page with range presets and a daily usage chart",
        height: 820,
      },
    },
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-300 px-6 py-24">
      <SectionHeader
        eyebrow="How it works"
        title="From first payment to revenue report, in three steps"
      />
      <div className="relative mt-14 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-7">
        {/* Dashed line joining the step numbers, on wide screens */}
        <div
          aria-hidden
          className="absolute inset-x-15 top-11.75 z-0 hidden border-t-2 border-dashed border-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-frame))] min-[1000px]:block"
        />
        {STEPS.map((step, i) => (
          <article
            key={step.title}
            className={cn(
              reveal,
              "group bg-step-card relative z-10 flex flex-col rounded-[20px]",
              "shadow-[inset_0_1px_0_#fff,0_1px_2px_rgba(11,18,21,0.04),0_12px_28px_-18px_rgba(11,18,21,0.22)] transition-[translate,box-shadow] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
              "hover:shadow-[inset_0_1px_0_#fff,0_0_0_1px_color-mix(in_srgb,var(--color-primary)_40%,transparent),0_24px_48px_-22px_color-mix(in_srgb,var(--color-primary)_55%,rgba(11,18,21,0.4))] motion-safe:hover:-translate-y-1",
            )}
          >
            <div className="flex flex-1 flex-col gap-3.5 px-6.5 pt-6.5 pb-5.5">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex size-11 flex-none items-center justify-center rounded-[13px] border border-[color-mix(in_srgb,var(--color-primary)_40%,#fff)] bg-primary/9 font-mono text-[15px] font-semibold text-primary shadow-[0_0_0_6px_#fff] transition-colors duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-white">
                  0{i + 1}
                </span>
                <span className="flex flex-wrap justify-end gap-1.5">
                  {step.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex h-6.5 items-center rounded-full border border-line bg-surface px-2.5 text-[12.5px] font-medium whitespace-nowrap text-[#3f4b52]"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              </div>
              <h3 className="mt-1.5 text-[21px] leading-tight font-semibold tracking-[-0.015em]">
                {step.title}
              </h3>
              <p className="text-[16px] leading-[1.55] text-body">{step.text}</p>
            </div>
            <StepWindow label={step.window.label} dark={!step.window.image}>
              {step.window.image ? (
                <Image
                  src={step.window.image.src}
                  alt={step.window.image.alt}
                  width={1280}
                  height={step.window.image.height}
                  sizes="(max-width: 960px) 100vw, 380px"
                  className="block h-50 w-full origin-top-left object-cover object-top-left transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-safe:group-hover:scale-[1.035]"
                />
              ) : (
                <UsageRequest />
              )}
            </StepWindow>
          </article>
        ))}
      </div>
    </section>
  );
}

// A small window frame (three dots and a label) around a screenshot or code
function StepWindow({
  label,
  dark,
  children,
}: {
  label: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-4.5 mb-4.5 overflow-hidden rounded-[14px] border shadow-[0_1px_2px_rgba(11,18,21,0.05)]",
        dark ? "border-[#1e2a2f] bg-ink" : "border-frame bg-surface",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "flex h-7.5 items-center gap-1.5 border-b px-3",
          dark ? "border-[#1e2a2f] bg-[#121c20]" : "border-line bg-white",
        )}
      >
        {[0, 1, 2].map((i) => (
          <i key={i} className={cn("size-2 rounded-full", dark ? "bg-[#2a383d]" : "bg-frame")} />
        ))}
        <span className={cn("ml-1.5 font-mono text-[11.5px]", dark ? "text-sage" : "text-subtle")}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function UsageRequest() {
  return (
    <pre className="min-h-50 overflow-hidden px-4 py-4.5 font-mono text-[12px] leading-[1.7] wrap-anywhere whitespace-pre-wrap text-code">
      <span className="text-mint">POST</span>
      {" /api/v1/usage\n"}
      <span className="text-sage">x-api-key:</span>
      {" lf_live_3Hq9…\n\n{\n  "}
      <span className="text-sky">&quot;metric&quot;</span>
      {": "}
      <span className="text-gold">&quot;documents_processed&quot;</span>
      {",\n  "}
      <span className="text-sky">&quot;quantity&quot;</span>
      {": "}
      <span className="text-gold">25</span>
      {",\n  "}
      <span className="text-sky">&quot;idempotencyKey&quot;</span>
      {": "}
      <span className="text-gold">&quot;job-8831-batch-2&quot;</span>
      {"\n}"}
    </pre>
  );
}
