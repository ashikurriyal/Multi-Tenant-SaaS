import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { ArrowIcon } from "./icons";

type Props = ComponentProps<typeof Link> & {
  variant?: "primary" | "ghost";
  // A light sweep across the button every few seconds, for the main call to action
  shine?: boolean;
  arrow?: boolean;
};

// The landing page's call-to-action links: they lift on hover and press in on click.
// Size (padding, height, font size, radius) comes from className.
export default function ButtonLink({
  variant = "primary",
  shine,
  arrow,
  className,
  children,
  ...props
}: Props) {
  return (
    <Link
      className={cn(
        "group relative isolate inline-flex items-center justify-center gap-2 overflow-hidden no-underline",
        "transition-[translate,scale,box-shadow,background-color,border-color,color] duration-250 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
        "motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-97 motion-safe:active:duration-80",
        "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary",
        variant === "primary"
          ? "bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_16px_-10px_color-mix(in_srgb,var(--color-primary)_80%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-primary)_86%,#000)] hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_14px_30px_-12px_color-mix(in_srgb,var(--color-primary)_90%,transparent)]"
          : "border border-line-strong bg-white text-ink hover:border-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-line-strong))] hover:bg-primary/6 hover:text-brand-deep",
        className,
      )}
      {...props}
    >
      {variant === "primary" && (
        // Resting offset is set on transform, the same property the shine animates: a
        // translate-x class would add to it and leave the band parked over the button
        <span
          aria-hidden
          className={cn(
            "bg-shine pointer-events-none absolute inset-0 -z-10 [transform:translateX(-120%)]",
            shine ? "motion-safe:animate-shine-loop" : "motion-safe:group-hover:animate-shine",
          )}
        />
      )}
      {children}
      {arrow && <ArrowIcon size={16} />}
    </Link>
  );
}
