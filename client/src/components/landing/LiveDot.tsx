import { cn } from "@/lib/utils";

// A small dot with a soft pulse, for "live" labels. Size and color come from className.
export default function LiveDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-block size-2 shrink-0 rounded-full bg-primary",
        "after:absolute after:inset-0 after:rounded-full after:bg-inherit after:opacity-0 after:content-['']",
        "motion-safe:after:animate-ping-soft",
        className,
      )}
    />
  );
}
