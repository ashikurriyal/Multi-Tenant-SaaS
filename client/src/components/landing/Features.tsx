import { cn } from "@/lib/utils";
import SectionHeader from "./SectionHeader";
import { reveal } from "./ui";

// The six feature cards; each icon has its own hover animation

// Parts of an icon animate around their own box
const part = "[transform-box:fill-box]";
const draw = "motion-safe:group-hover:[stroke-dasharray:1] motion-safe:group-hover:animate-draw";

const FEATURES: {
  title: string;
  text: string;
  proof: string;
  icon: React.ReactNode;
  svgClass?: string;
}[] = [
  {
    title: "Organizations and roles",
    text: "Owner, Admin, Billing and Member roles, email invitations and seat limits per plan. Other organizations' data answers 404, never 403.",
    proof: "4 roles · 404, never 403",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        {/* The second person nudges in */}
        <path
          className={cn(part, "motion-safe:group-hover:animate-nudge")}
          d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"
        />
      </>
    ),
  },
  {
    title: "Metered usage with real limits",
    text: "Free stops at its limit with a clear 429; paid plans continue into overage, billed through a Stripe meter. Idempotent by design.",
    proof: "429 at the limit · overage on paid",
    // The bars grow one after another, like a meter filling
    icon: ["M6 20v-4", "M12 20V10", "M18 20V4"].map((d, i) => (
      <path
        key={d}
        d={d}
        style={{ animationDelay: `${i * 80}ms` }}
        className={cn(part, "origin-bottom motion-safe:group-hover:animate-grow-bar")}
      />
    )),
  },
  {
    title: "Stripe billing, end to end",
    text: "Checkout, upgrades and downgrades with proration, the Customer Portal, and a 7-day grace period with emails when a payment fails.",
    proof: "Proration · 7-day grace",
    svgClass: "motion-safe:group-hover:animate-tilt", // the card tilts
    icon: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20M6 15h4" />
      </>
    ),
  },
  {
    title: "Revenue analytics",
    text: "MRR and its movements, customer churn, net revenue retention and ARPA for 6, 12 or 24 months, from daily snapshots.",
    proof: "MRR · churn · NRR · ARPA",
    icon: (
      <>
        <path d="M3 3v18h18" />
        {/* The trend line draws itself */}
        <path className={draw} pathLength={1} d="M7 15l4-4 3 3 5-6" />
      </>
    ),
  },
  {
    title: "API keys",
    text: "Create keys for each environment, shown once and stored only as a hash. Revoking takes effect on the very next request.",
    proof: "Shown once · hashed at rest",
    svgClass: "origin-[33%_62%] motion-safe:group-hover:animate-turn", // the key turns
    icon: (
      <>
        <circle cx="8" cy="15" r="4" />
        <path d="M10.8 12.2L20 3M17 6l3 3M14 9l2 2" />
      </>
    ),
  },
  {
    title: "Audit log",
    text: "Every invitation, role change, API key and billing change, written in plain sentences with who made it, including Stripe and scheduled jobs.",
    proof: "Who, what and when",
    icon: (
      <>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6" />
        {/* The log lines write themselves in */}
        <path className={draw} pathLength={1} d="M8 13h8" />
        <path className={draw} style={{ animationDelay: "0.15s" }} pathLength={1} d="M8 17h5" />
      </>
    ),
  },
];

export default function Features() {
  return (
    <section id="features" className="border-y border-divider bg-surface">
      <div className="mx-auto max-w-300 px-6 py-24">
        <SectionHeader eyebrow="Features" title="Everything a B2B SaaS needs around billing" />
        <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className={cn(
                reveal,
                "group bg-feature-card relative isolate flex flex-col gap-3 overflow-hidden rounded-[18px] p-7",
                "shadow-[0_1px_2px_rgba(11,18,21,0.04),0_10px_24px_-18px_rgba(11,18,21,0.2)] transition-[translate,box-shadow] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
                "hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-primary)_45%,transparent),0_22px_44px_-22px_color-mix(in_srgb,var(--color-primary)_55%,rgba(11,18,21,0.4))] motion-safe:hover:-translate-y-1",
              )}
            >
              {/* Soft teal light from the top-left corner on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(420px_circle_at_0%_0%,color-mix(in_srgb,var(--color-primary)_11%,transparent),transparent_60%)] opacity-0 transition-opacity duration-350 group-hover:opacity-100"
              />
              <span
                className={cn(
                  "inline-flex size-12 flex-none items-center justify-center rounded-[14px] border border-[color-mix(in_srgb,var(--color-primary)_28%,#fff)] bg-linear-160 from-white to-[color-mix(in_srgb,var(--color-primary)_12%,#fff)] text-primary",
                  "shadow-[inset_0_1px_0_#fff,0_6px_14px_-10px_color-mix(in_srgb,var(--color-primary)_80%,transparent)] transition-[background-color,color,border-color,box-shadow] duration-300",
                  "group-hover:border-primary group-hover:from-[color-mix(in_srgb,var(--color-primary)_80%,#fff)] group-hover:to-primary group-hover:text-white group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_20px_-10px_var(--color-primary)]",
                )}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className={f.svgClass}
                >
                  {f.icon}
                </svg>
              </span>
              <h3 className="mt-1.5 text-[19px] leading-[1.3] font-semibold tracking-[-0.01em]">
                {f.title}
              </h3>
              <p className="text-[15.5px] leading-[1.55] text-body">{f.text}</p>
              <span className="mt-auto flex items-start gap-2 border-t border-dashed border-frame pt-4 font-mono text-[12.5px] text-[#3f4b52] transition-colors duration-250 group-hover:text-brand-deep">
                <span aria-hidden className="mt-1.5 size-1.5 flex-none rounded-full bg-primary" />
                {f.proof}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
