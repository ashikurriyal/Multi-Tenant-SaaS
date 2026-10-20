import { cn } from "@/lib/utils";
import LiveDot from "./LiveDot";
import { reveal } from "./ui";

// "Built to be correct": the measured claims, each with a small visual. Their intro
// animations play once the section scrolls into view (data-intro, see LandingEffects).

// Lucide-style icon paths for the card labels
const ICONS = {
  bolt: ["M13 2L3 14h9l-1 8 10-12h-9z"],
  arrow: ["M4 12h16M14 6l6 6-6 6"],
  shield: ["M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z", "M9 12l2 2 4-4"],
  pulse: ["M3 12h4l3-8 4 16 3-8h4"],
  check: ["M20 6L9 17l-5-5"],
};

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICONS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

// Intros that play once the section is in view, hidden before that. Written out in full:
// Tailwind only generates classes it can find literally in the source.
const INTRO = {
  meter:
    "motion-safe:group-data-[intro=pending]/proof:scale-x-0 motion-safe:group-data-[intro=play]/proof:[animation:lf-fill_1.4s_cubic-bezier(0.2,0.7,0.2,1)_0.3s_both]",
  bar: "motion-safe:group-data-[intro=pending]/proof:scale-x-0 motion-safe:group-data-[intro=play]/proof:[animation:lf-fill_1.2s_cubic-bezier(0.2,0.7,0.2,1)_both]",
  square:
    "motion-safe:group-data-[intro=pending]/proof:opacity-0 motion-safe:group-data-[intro=play]/proof:[animation:lf-pop-in_0.35s_cubic-bezier(0.2,0.7,0.2,1)_both]",
  line: "motion-safe:group-data-[intro=pending]/proof:opacity-0 motion-safe:group-data-[intro=play]/proof:[animation:lf-slide-in_0.4s_ease_both]",
};

export default function Proof() {
  return (
    <section data-lf-io className="group/proof relative isolate overflow-hidden bg-ink text-cloud">
      <div
        aria-hidden
        className="bg-proof pointer-events-none absolute inset-0 -z-10 mask-[linear-gradient(180deg,#000_0%,#000_75%,transparent_100%)]"
      />
      <div className="relative mx-auto max-w-300 px-6 py-28">
        <div className={cn(reveal, "flex max-w-190 flex-col gap-3")}>
          <p className="inline-flex items-center gap-2 text-[14px] font-semibold tracking-[0.08em] text-[color-mix(in_srgb,var(--color-primary)_45%,#fff)] uppercase">
            <LiveDot className="size-1.75 bg-mint" />
            Built to be correct
          </p>
          <h2 className="text-[clamp(30px,3.4vw,44px)] leading-[1.1] font-[650] tracking-tight text-white">
            The hard parts,{" "}
            <span className="bg-linear-to-r from-mint from-10% to-lime to-90% bg-clip-text text-transparent">
              measured
            </span>
          </h2>
          <p className="text-[17px] leading-[1.6] text-mist">
            Billing bugs cost money and trust. These are tested against a real database and Stripe,
            not assumed.
          </p>
        </div>

        <div className="mt-13 grid grid-cols-3 gap-5 max-[960px]:grid-cols-1">
          <ProofCard wide icon="bolt" label="Concurrency">
            <Split>
              <div className="flex min-w-0 flex-col gap-3">
                <Figure value="33" unit="of 50" />
                <Text>
                  simultaneous 30-unit requests accepted at a 1,000-unit limit. The counter stops at
                  990, never over.
                </Text>
                <div className="mt-1 flex flex-col gap-2">
                  <div className="flex justify-between font-mono text-[12px] text-sage">
                    <span>Counter</span>
                    <span className="text-cloud">990 / 1,000</span>
                  </div>
                  <span className="block h-2 overflow-hidden rounded-full bg-[#1a282c]">
                    <span
                      className={cn(
                        "block h-full w-[99%] origin-left rounded-full bg-linear-to-r from-primary to-mint shadow-[0_0_12px_rgba(95,211,181,0.5)]",
                        INTRO.meter,
                      )}
                    />
                  </span>
                </div>
              </div>
              <div aria-hidden className="flex min-w-0 flex-col gap-3">
                {/* One square per request, in arrival order: the first 33 got in */}
                <div className="grid grid-cols-10 gap-1.75 rounded-[14px] border border-night-line bg-black/25 p-4">
                  {Array.from({ length: 50 }, (_, i) => (
                    <span
                      key={i}
                      style={{ animationDelay: `${i * 22}ms` }}
                      className={cn(
                        "inline-block aspect-square w-full rounded-[5px]",
                        i < 33
                          ? "bg-linear-160 from-mint to-primary shadow-[0_0_10px_-2px_rgba(95,211,181,0.6)]"
                          : "border-[1.5px] border-[rgba(236,91,114,0.55)]",
                        INTRO.square,
                      )}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-[11.5px] text-sage">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.25 rounded-[5px] bg-linear-160 from-mint to-primary" />
                    202 accepted · 33
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.25 rounded-[5px] border-[1.5px] border-[rgba(236,91,114,0.55)]" />
                    429 rejected · 17
                  </span>
                </div>
              </div>
            </Split>
          </ProofCard>

          <ProofCard icon="arrow" label="Stripe webhooks">
            <Figure value="Exactly once" />
            <Text>Signed, stored, claimed atomically and retried with backoff.</Text>
            <ol className="relative mt-1.5 flex flex-col">
              {[
                "Signature verified",
                "Stored in the inbox",
                "Claimed atomically",
                "Processed once",
                "Reconciled nightly",
              ].map((step, i) => (
                <li
                  key={step}
                  className="relative flex h-8.5 items-center gap-3 text-[13.5px] text-fog not-last:after:absolute not-last:after:top-6 not-last:after:left-1.5 not-last:after:h-5 not-last:after:w-0.5 not-last:after:bg-[#22343a] not-last:after:content-['']"
                >
                  {/* Lights up in turn, looping; solid teal when motion is off */}
                  <span
                    style={{ animationDelay: `${i * 0.6}s` }}
                    className="size-3.5 flex-none rounded-full border-2 border-primary bg-primary motion-safe:border-[#2c4047] motion-safe:bg-[#0d171a] motion-safe:group-data-[intro=play]/proof:animate-node"
                  />
                  {step}
                </li>
              ))}
            </ol>
          </ProofCard>

          <ProofCard icon="shield" label="Tenant isolation">
            <Figure value="40" unit="checks" />
            <Text>
              Tenant-isolation and permission checks against PostgreSQL in CI, on every pull
              request.
            </Text>
            {/* The real CI steps (.github/workflows/ci.yml), typed out line by line */}
            <div
              aria-hidden
              className="mt-auto rounded-[12px] border border-night-line bg-[#070c0e] px-4 py-3.5 font-mono text-[12px] leading-[1.9] text-fog"
            >
              {[
                <>
                  <span className="text-[#5B6E69]">postgres:16</span>{" "}
                  <span className="text-mint">ready</span>
                </>,
                <>
                  <span className="text-mint">$</span> npx prisma migrate deploy
                </>,
                <>
                  <span className="text-mint">$</span> npm run verify:tenancy
                </>,
                <>
                  <span className="font-semibold text-mint">✓ 40 passed</span>{" "}
                  <span className="text-[#5B6E69]">· 0 failed</span>
                </>,
              ].map((line, i) => (
                <div
                  key={i}
                  style={{ animationDelay: `${0.3 + i * 0.45}s` }}
                  className={INTRO.line}
                >
                  {line}
                </div>
              ))}
            </div>
          </ProofCard>

          <ProofCard wide icon="pulse" label="Metering">
            <Split>
              <div className="flex min-w-0 flex-col gap-3">
                <Figure value="0" unit="double charges" />
                <Text>
                  Usage goes to the Stripe meter with a per-event identifier, so a retry can never
                  bill twice. Stripe’s total matched the units we reported.
                </Text>
              </div>
              <div
                aria-hidden
                className="flex flex-col gap-3.5 rounded-[14px] border border-night-line bg-black/25 p-4.5"
              >
                {[
                  {
                    label: "Reported by LedgerFlow",
                    dot: "bg-mint",
                    bar: "from-primary to-mint shadow-[0_0_12px_rgba(95,211,181,0.45)]",
                    delay: "0.4s",
                  },
                  {
                    label: "Counted by Stripe’s meter",
                    dot: "bg-[#e8b04b]",
                    bar: "from-[#e8b04b] to-[#ffe1a1] shadow-[0_0_12px_rgba(232,176,75,0.4)]",
                    delay: "0.75s",
                  },
                ].map((row) => (
                  <div key={row.label} className="flex flex-col gap-1.75 text-[12.5px] text-sage">
                    <span className="inline-flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", row.dot)} />
                      {row.label}
                    </span>
                    <span className="block h-2.5 overflow-hidden rounded-full bg-[#1a282c]">
                      <span
                        style={{ animationDelay: row.delay }}
                        className={cn(
                          "block h-full w-full origin-left rounded-full bg-linear-to-r",
                          row.bar,
                          INTRO.bar,
                        )}
                      />
                    </span>
                  </div>
                ))}
                <span className="inline-flex h-7 items-center gap-1.5 self-start rounded-full border border-mint/30 bg-mint/12 px-2.75 text-[12.5px] font-semibold text-mint">
                  <Icon name="check" />
                  Totals match
                </span>
              </div>
            </Split>
          </ProofCard>
        </div>

        <div className={cn(reveal, "mt-9 flex flex-wrap gap-3")}>
          <ProofLink href="https://github.com/ashikurriyal/Multi-Tenant-SaaS/tree/main/docs/adr">
            Read the architecture decisions
          </ProofLink>
          <ProofLink href="https://github.com/ashikurriyal/Multi-Tenant-SaaS">
            Browse the source on GitHub
          </ProofLink>
        </div>
      </div>
    </section>
  );
}

function ProofCard({
  wide,
  icon,
  label,
  children,
}: {
  wide?: boolean;
  icon: keyof typeof ICONS;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        reveal,
        "group bg-proof-card relative isolate flex flex-col gap-3 overflow-hidden rounded-[20px] p-6.5",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_40px_-28px_rgba(0,0,0,0.8)] transition-[translate,box-shadow] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
        "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_1px_color-mix(in_srgb,var(--color-primary)_50%,transparent),0_28px_60px_-30px_color-mix(in_srgb,var(--color-primary)_60%,#000)] motion-safe:hover:-translate-y-1",
        wide && "col-span-2 max-[960px]:col-auto",
      )}
    >
      {/* Teal light in the top-left corner, brighter on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(380px_circle_at_0%_0%,color-mix(in_srgb,var(--color-primary)_16%,transparent),transparent_65%)] opacity-50 transition-opacity duration-350 group-hover:opacity-100"
      />
      <span className="inline-flex h-6.5 items-center gap-1.75 self-start rounded-full border border-mint/18 bg-mint/8 px-2.5 text-[12px] font-semibold tracking-[0.02em] text-mint">
        <Icon name={icon} />
        {label}
      </span>
      {children}
    </article>
  );
}

function Split({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid flex-1 grid-cols-2 items-center gap-7 max-[640px]:grid-cols-1">
      {children}
    </div>
  );
}

function Figure({ value, unit }: { value: string; unit?: string }) {
  return (
    <p className="mt-1.5 text-[42px] leading-none font-[650] tracking-[-0.03em] text-white">
      {value}{" "}
      {unit && <span className="text-[20px] font-medium tracking-[-0.01em] text-sage">{unit}</span>}
    </p>
  );
}

function Text({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-[1.55] text-[#b9c6c2]">{children}</p>;
}

function ProofLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="group inline-flex min-h-11 items-center gap-2 rounded-[12px] border border-[#24343a] bg-white/2 px-4 text-[15px] font-medium text-cloud no-underline transition-[border-color,background-color] duration-200 hover:border-[color-mix(in_srgb,var(--color-primary)_60%,#24343a)] hover:bg-primary/12 hover:text-cloud focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
    >
      {children}
      <svg
        className="transition-transform duration-250 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-safe:group-hover:translate-x-1"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </a>
  );
}
