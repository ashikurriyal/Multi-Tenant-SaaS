import { cn } from "@/lib/utils";

// A 1px frame with a slowly rotating teal glow, around the hero walkthrough and the other
// product windows. The ring must cover the frame at every angle: wide frames need less.
export default function GlowFrame({
  wide,
  className,
  children,
}: {
  wide?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative isolate rounded-[16px] p-px", className)}>
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-px -z-10 overflow-hidden rounded-[17px] opacity-55"
      >
        <span
          className={cn(
            "bg-glow-ring absolute top-1/2 left-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 will-change-transform motion-safe:animate-ring-spin",
            wide ? "w-[130%]" : "w-[200%]",
          )}
        />
      </span>
      {children}
    </div>
  );
}
