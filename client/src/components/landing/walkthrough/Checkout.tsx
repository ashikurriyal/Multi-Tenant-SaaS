import { cn } from "@/lib/utils";
import type { State } from "./script";

const field = "flex h-[2.4em] items-center rounded-[0.55em] px-[0.8em]";
const fieldLabel = "text-[0.66em] leading-none font-semibold";
const fieldText = "font-mono text-[0.76em] leading-none";

// The Stripe-style checkout dialog: the card number types in, then Pay spins
export default function Checkout({ s }: { s: State }) {
  return (
    <div className="absolute inset-0 z-3 flex animate-fade items-center justify-center bg-ink/32">
      <div className="flex w-[24em] animate-pop flex-col gap-[1em] rounded-[1em] bg-white p-[1.4em] shadow-[0_1.6em_3.2em_-1.2em_rgba(11,18,21,0.5)]">
        <div className="flex items-center justify-between gap-[1em]">
          <span className="text-[1em] leading-none font-[650]">Upgrade to Pro</span>
          <span className="inline-flex h-[1.6em] items-center rounded-[0.4em] bg-[#FEF3C7] px-[0.6em]">
            <span className="font-mono text-[0.58em] leading-none font-semibold text-[#8A3F06]">
              TEST MODE
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between border-y border-line-soft py-[0.85em]">
          <span className="text-[0.76em] leading-none">Pro · monthly</span>
          <span className="text-[0.76em] leading-none font-semibold tabular-nums">$49.00</span>
        </div>
        <div className="flex flex-col gap-[0.5em]">
          <span className={fieldLabel}>Card number</span>
          <span
            data-lf="card"
            className={cn(
              field,
              "border transition-[border-color,box-shadow] duration-200",
              s.cardFocus
                ? "border-primary shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_18%,transparent)]"
                : "border-line-strong",
            )}
          >
            <span
              className={cn(
                fieldText,
                "tracking-[0.04em]",
                s.cardText ? "text-ink" : "text-[#9AA8A4]",
              )}
            >
              {s.cardText || "1234 1234 1234 1234"}
            </span>
            {s.cardFocus && <span className="ml-0.5 h-[1.1em] w-px animate-caret bg-ink" />}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-[0.8em]">
          {[
            ["Expiry", "12 / 30"],
            ["CVC", "123"],
          ].map(([name, value]) => (
            <span key={name} className="flex flex-col gap-[0.5em]">
              <span className={fieldLabel}>{name}</span>
              <span className={cn(field, "border border-line-strong")}>
                <span className={fieldText}>{value}</span>
              </span>
            </span>
          ))}
        </div>
        <span
          data-lf="pay"
          className={cn(
            "flex h-[2.6em] items-center justify-center gap-[0.55em] rounded-[0.6em] transition-[background-color] duration-150",
            s.press === "pay" ? "bg-black" : "bg-ink",
          )}
        >
          {s.paying && (
            <span className="size-[0.9em] animate-spin-fast rounded-full border-2 border-white/35 border-t-white" />
          )}
          <span className="text-[0.76em] leading-none font-medium text-white">
            {s.paying ? "Processing…" : "Pay $49.00"}
          </span>
        </span>
      </div>
    </div>
  );
}
