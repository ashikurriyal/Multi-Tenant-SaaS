import { cn } from "@/lib/utils";
import { CheckIcon } from "./icons";
import RevenuePreview from "./RevenuePreview";
import { eyebrow, reveal } from "./ui";

// "For the platform team": the super-admin revenue view, with a working range switch

const POINTS = [
  "New, expansion, contraction, churn and reactivation per month",
  "Rates from complete months, so a partial month never flatters churn",
  "Webhook inbox with retries and exhausted events flagged",
];

export default function Platform() {
  return (
    <section className="mx-auto flex max-w-300 flex-wrap items-center gap-12 px-6 py-24">
      <div className={cn(reveal, "flex min-w-0 flex-[1_1_340px] flex-col gap-4")}>
        <p className={eyebrow}>For the platform team</p>
        <h2 className="text-[clamp(28px,3vw,40px)] leading-[1.12] font-[650] tracking-tight">
          Revenue health across every customer
        </h2>
        <p className="text-[17px] leading-[1.6] text-body">
          A super-admin view with MRR, what moved it each month, churn, NRR and ARPA, plus every
          organization and any Stripe event that failed to process.
        </p>
        <ul className="mt-2 flex flex-col gap-3 text-[16px] text-ink-soft">
          {POINTS.map((p) => (
            <li key={p} className="flex items-start gap-2.5">
              <CheckIcon size={20} className="mt-0.5 flex-none text-primary stroke-[2.2]" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <RevenuePreview />
    </section>
  );
}
