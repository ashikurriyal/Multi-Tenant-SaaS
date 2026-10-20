"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowIcon, ExternalIcon } from "./icons";
import { focusRing, reveal } from "./ui";

// FAQ "spec explorer": six questions on the left, the answer with a small visual of the
// mechanism and its source file on the right. It advances every 9 s until the visitor
// picks a question (and never for visitors who prefer reduced motion).

const ROW = 72; // height of one question row (h-18)
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

  return (
    <section id="faq" className="mx-auto max-w-300 px-6 py-22">
      <div className={cn(reveal, "flex max-w-160 flex-col gap-2.5")}>
        <p className="text-[14px] font-semibold tracking-[0.08em] text-primary uppercase">FAQ</p>
        <h2 className="text-[clamp(28px,3vw,38px)] leading-[1.12] font-[650] tracking-tight">
          How it holds up in production
        </h2>
        <p className="text-[16px] leading-[1.55] text-body">
          Six questions engineers ask about billing systems, each answered with the mechanism and
          the file that implements it.
        </p>
      </div>

      <div
        className={cn(
          reveal,
          "mt-8 grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)] overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_1px_2px_rgba(11,18,21,0.04),0_30px_60px_-44px_rgba(11,18,21,0.4)] max-[900px]:grid-cols-1",
        )}
      >
        <div
          role="group"
          aria-label="Questions"
          className="relative flex flex-col border-r border-divider bg-surface p-3 max-[900px]:border-r-0 max-[900px]:border-b"
        >
          {/* The white card that slides behind the selected question */}
          <span
            aria-hidden
            style={{ transform: `translateY(${idx * ROW}px)` }}
            className="absolute inset-x-3 top-3 h-18 rounded-[14px] border border-line bg-white shadow-[0_10px_24px_-18px_rgba(11,18,21,0.35)] transition-transform duration-450 ease-[cubic-bezier(0.3,1.15,0.4,1)] before:absolute before:inset-y-4 before:-left-px before:w-0.75 before:rounded-r-[3px] before:bg-primary before:content-['']"
          />
          {QUESTIONS.map((q, i) => (
            <button
              key={q.tag}
              type="button"
              onClick={() => pick(i)}
              aria-pressed={idx === i}
              data-on={idx === i}
              className="group relative z-10 grid h-18 cursor-pointer grid-cols-[30px_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-[14px] px-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
            >
              <span className="font-mono text-[12.5px] text-[#9aa8a4] transition-colors duration-250 group-data-[on=true]:text-primary">
                0{i + 1}
              </span>
              <span className="text-[15px] leading-[1.35] font-medium text-body transition-colors duration-250 group-hover:text-ink group-data-[on=true]:font-semibold group-data-[on=true]:text-ink">
                {q.question}
              </span>
              {/* Time until auto-advance moves on */}
              {auto && idx === i && (
                <span
                  aria-hidden
                  className="absolute inset-x-4 bottom-2.25 h-0.5 origin-left rounded-xs bg-primary/60 opacity-0 motion-safe:animate-[lf-fill_9s_linear_both] motion-safe:opacity-100"
                />
              )}
            </button>
          ))}
        </div>

        <div
          aria-live="polite"
          className="relative min-h-114 bg-[radial-gradient(500px_260px_at_100%_0%,color-mix(in_srgb,var(--color-primary)_7%,transparent),transparent_70%),#fff]"
        >
          <Answer key={idx} q={QUESTIONS[idx]} onNext={() => pick((idx + 1) % COUNT)} />
        </div>
      </div>
    </section>
  );
}

const GITHUB = "https://github.com/ashikurriyal/Multi-Tenant-SaaS/blob/main/";

type Question = {
  tag: string;
  question: string;
  answer: string;
  source: string;
  visual: React.ReactNode;
};

// Mounted per question (key), so the panel's pieces rise in again on every change
function Answer({ q, onNext }: { q: Question; onNext: () => void }) {
  return (
    <div className="flex h-full flex-col gap-3 px-7.5 pt-7 pb-5.5 motion-safe:*:animate-rise motion-safe:[&>*:nth-child(2)]:[animation-delay:40ms] motion-safe:[&>*:nth-child(3)]:[animation-delay:80ms] motion-safe:[&>*:nth-child(4)]:[animation-delay:140ms] motion-safe:[&>*:nth-child(5)]:[animation-delay:200ms]">
      <span className="inline-flex h-6 items-center self-start rounded-full bg-primary/10 px-2.5 text-[12px] font-semibold tracking-[0.02em] text-brand-deep">
        {q.tag}
      </span>
      <h3 className="text-[22px] leading-tight font-[650] tracking-[-0.02em]">{q.question}</h3>
      <p className="text-[15px] leading-[1.6] text-body">{q.answer}</p>
      <div className="mt-1 flex flex-col gap-2.5">{q.visual}</div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2.5 border-t border-line-soft pt-3.5">
        <a
          href={GITHUB + q.source}
          className={cn(
            "-ml-2 inline-flex min-w-0 items-center gap-1.75 rounded-[8px] px-2 py-1.5 font-mono text-[12px] text-body no-underline transition-colors duration-200 hover:bg-[#f2f5f4] hover:text-brand-deep",
            focusRing,
          )}
        >
          <ExternalIcon />
          <span className="truncate">{q.source}</span>
        </a>
        <button
          type="button"
          onClick={onNext}
          className={cn(
            "group inline-flex h-9 cursor-pointer items-center gap-1.75 rounded-[10px] border border-line-strong bg-white px-3.5 text-[13.5px] font-medium text-ink transition-colors duration-200 hover:border-primary hover:text-brand-deep",
            focusRing,
          )}
        >
          Next question
          <ArrowIcon
            size={14}
            className="transition-transform duration-250 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-safe:group-hover:translate-x-0.75"
          />
        </button>
      </div>
    </div>
  );
}

// Building blocks for the answers' visuals
function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[12px] bg-ink px-4 py-3.5 font-mono text-[12px] leading-[1.75] text-code *:whitespace-pre-wrap *:wrap-anywhere">
      {children}
    </div>
  );
}
function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}
function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-[8px] border border-line-soft bg-surface px-2.5 py-1 font-mono text-[11.5px] text-ink-soft",
        className,
      )}
    >
      {children}
    </span>
  );
}
function Stat({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7.5 items-baseline gap-1.5 rounded-full border border-line-soft bg-surface px-3 text-[12.5px] leading-7.5 text-subtle">
      <b className="text-[15px] font-[650] text-ink">{value}</b> {children}
    </span>
  );
}
const kw = "text-mint";
const str = "text-gold";
const comment = "text-moss";

const QUESTIONS: Question[] = [
  {
    tag: "Tenant isolation",
    question: "How is each customer’s data kept separate?",
    answer:
      "Every query goes through a tenant-scoped client that adds the organization for you. Another organization’s ids answer 404, never 403, and 40 isolation checks run in CI on every pull request.",
    source: "server/src/lib/tenantPrisma.ts",
    visual: (
      <>
        <CodeBlock>
          <div>
            <span className={comment}>{"// what the service writes"}</span>
          </div>
          <div>
            db.invoice.findMany({"{"} where: {"{"} status:{" "}
            <span className={str}>&apos;paid&apos;</span> {"}"} {"}"})
          </div>
          <div className="mt-2">
            <span className={comment}>{"// what reaches PostgreSQL"}</span>
          </div>
          <div>
            … where: {"{"} status: <span className={str}>&apos;paid&apos;</span>,{" "}
            <span className="rounded-lg bg-mint/14 px-1 py-px shadow-[inset_0_0_0_1px_rgba(95,211,181,0.35)]">
              organizationId: <span className={str}>&apos;org_acme&apos;</span>
            </span>{" "}
            {"}"}
          </div>
        </CodeBlock>
        <Row>
          <Pill>GET /globex/invoices/inv_77 · signed in to Acme</Pill>
          <span className="inline-flex h-7 items-center rounded-[8px] bg-[#FDECEF] px-2.5 font-mono text-[12.5px] font-bold text-[#A3243A]">
            404
          </span>
        </Row>
      </>
    ),
  },
  {
    tag: "Concurrency",
    question: "Can a burst of requests go over the limit?",
    answer:
      "No. The increment and the limit check are a single PostgreSQL statement, so parallel requests can’t race past the limit. If the row doesn’t come back, the request gets a 429.",
    source: "server/src/modules/usage/usage.service.ts",
    visual: (
      <>
        <CodeBlock>
          <div>
            <span className={kw}>INSERT INTO</span> usage_counters (…){" "}
            <span className={kw}>SELECT</span> …
          </div>
          <div>
            <span className={kw}>ON CONFLICT</span> (&quot;organizationId&quot;,
            &quot;periodStart&quot;) <span className={kw}>DO UPDATE</span>
          </div>
          <div>
            {"\u00a0\u00a0"}
            <span className={kw}>SET</span> units = units + EXCLUDED.units
          </div>
          <div className="-mx-4 bg-mint/10 px-4 shadow-[inset_3px_0_0_var(--color-mint)]">
            {"\u00a0\u00a0"}
            <span className={kw}>WHERE</span> units + EXCLUDED.units &lt;={" "}
            <span className={str}>limit</span>
          </div>
          <div>
            <span className={kw}>RETURNING</span> units;{" "}
            <span className={comment}>-- no row back → 429</span>
          </div>
        </CodeBlock>
        <Row>
          <Stat value="50">parallel requests</Stat>
          <Stat value="33">accepted</Stat>
          <Stat value="990">/ 1,000 units</Stat>
        </Row>
      </>
    ),
  },
  {
    tag: "Webhooks",
    question: "What if Stripe sends the same event twice?",
    answer:
      "Signed events land in an inbox keyed by Stripe’s event id, are claimed atomically and processed exactly once. Failures retry with backoff, and a nightly job reconciles with Stripe.",
    source: "server/src/modules/webhook/webhook.processor.ts",
    visual: (
      <>
        <div className="flex flex-col gap-0.5 rounded-[12px] border border-line-soft bg-surface px-3.5 py-2.5">
          {[
            ["received", "signature verified, stored in the inbox", true],
            ["claimed", "one worker wins the atomic claim", true],
            ["processed", "subscription and invoice updated", true],
            ["again", "already in the inbox · skipped", false],
          ].map(([step, note, ok]) => (
            <div
              key={step as string}
              className="grid min-h-7.5 grid-cols-[10px_auto_minmax(0,1fr)] items-center gap-2.5"
            >
              <span className={cn("size-2 rounded-full", ok ? "bg-primary" : "bg-[#B7C2BF]")} />
              <span className="font-mono text-[12px] text-ink">evt_1Q8x… {step}</span>
              <span className="text-[12.5px] text-subtle">{note}</span>
            </div>
          ))}
        </div>
        <Row>
          <span className="text-[12.5px] text-subtle">On failure, retry after</span>
          {["2 min", "4 min", "8 min", "16 min"].map((t) => (
            <span
              key={t}
              className="inline-flex h-6.5 items-center rounded-[7px] border border-line bg-white px-2.25 font-mono text-[11.5px] text-brand-deep"
            >
              {t}
            </span>
          ))}
        </Row>
      </>
    ),
  },
  {
    tag: "Plan changes",
    question: "How do upgrades and downgrades work?",
    answer:
      "You see Stripe’s exact proration first. The change goes out with an idempotency key, and the plan switches only when Stripe’s webhook confirms it, so the app never runs ahead of billing.",
    source: "server/src/modules/billing/billing.service.ts",
    visual: (
      <>
        <div className="grid grid-cols-5 gap-1.5 rounded-[12px] border border-line-soft bg-surface px-3 pt-4 pb-3.5">
          {[
            "Proration preview",
            "You confirm",
            "Stripe updates",
            "Webhook confirms",
            "Plan active",
          ].map((step, i) => (
            <div
              key={step}
              className="relative flex flex-col items-center gap-2 text-center text-[11.5px] leading-[1.3] text-body not-last:after:absolute not-last:after:top-1.5 not-last:after:right-[calc(-50%+4px)] not-last:after:left-[calc(50%+10px)] not-last:after:h-0.5 not-last:after:bg-frame not-last:after:content-['']"
            >
              {/* Lights up in turn, looping; solid teal when motion is off */}
              <span
                style={{ animationDelay: `${i * 0.55}s` }}
                className="relative z-10 size-3.5 rounded-full border-2 border-primary bg-primary motion-safe:border-[#c9d3d0] motion-safe:bg-white motion-safe:animate-node-light"
              />
              <span>{step}</span>
            </div>
          ))}
        </div>
        <Row>
          <Pill>
            POST …/billing/change-plan → <b className="text-[#8A3F06]">pending</b> until Stripe
            confirms
          </Pill>
        </Row>
      </>
    ),
  },
  {
    tag: "Overage",
    question: "How is usage beyond the plan billed?",
    answer:
      "Paid plans keep accepting usage past the included units. A scheduled job reports it to a Stripe meter, and Stripe bills only the excess on the next invoice.",
    source: "server/src/jobs/reportUsage.ts",
    visual: (
      <>
        <div className="flex flex-col rounded-[12px] border border-dashed border-[#c9d3d0] bg-white px-4 py-1.5">
          {[
            ["Units this period", "62,000"],
            ["Included in Pro", "− 50,000"],
            ["Extra units", "12,000 × $0.002"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between gap-3 border-b border-dashed border-line py-2 text-[13.5px] text-body tabular-nums"
            >
              <span>{label}</span>
              <span className="font-mono text-[13px] text-ink">{value}</span>
            </div>
          ))}
          <div className="flex justify-between gap-3 py-2 text-[13.5px] font-semibold text-ink tabular-nums">
            <span>Overage on the next invoice</span>
            <span className="font-mono text-[15px] font-bold text-brand-deep">$24.00</span>
          </div>
        </div>
        <Row>
          <Pill>Each event reaches Stripe’s meter once, under its own identifier</Pill>
        </Row>
      </>
    ),
  },
  {
    tag: "Failed payments",
    question: "What happens when a payment fails?",
    answer:
      "Nothing breaks on day one. The workspace keeps full access for seven days while owners and billing members are emailed. After that, Free limits apply until the invoice is paid.",
    source: "server/src/shared/subscriptionState.ts",
    visual: (
      <>
        <div className="grid grid-cols-8 gap-1.25 rounded-[12px] border border-line-soft bg-surface p-3.5">
          {Array.from({ length: 8 }, (_, day) => (
            <span
              key={day}
              style={{ animationDelay: `${0.15 + day * 0.06}s` }}
              className="flex flex-col items-center gap-1.5 motion-safe:animate-pop-in"
            >
              <i
                className={cn(
                  "block h-2.5 w-full rounded-lg",
                  day === 0
                    ? "bg-[#e0533f] motion-safe:animate-[lf-blink_1.6s_ease-in-out_0.8s_infinite]"
                    : day === 7
                      ? "bg-[repeating-linear-gradient(135deg,#b7c2bf_0_4px,#dce3e1_4px_8px)]"
                      : "bg-[color-mix(in_srgb,var(--color-primary)_55%,#fff)]",
                )}
              />
              <em className="font-mono text-[10.5px] text-faint not-italic">Day {day}</em>
            </span>
          ))}
        </div>
        <Row className="justify-between">
          <Pill>Day 0 · email and banner</Pill>
          <Pill>Days 1–6 · full access</Pill>
          <Pill className="text-[#A3243A]">Day 7 · Free limits</Pill>
        </Row>
      </>
    ),
  },
];
