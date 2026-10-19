import { cn } from "@/lib/utils";

type MarkProps = { size?: number; className?: string };

// The LedgerFlow mark: three ledger lines on a teal tile, the top one flowing into a dot.
// The same drawing is the favicon (src/app/icon.svg). Every copy declares the same
// gradient id, so repeating the mark on a page is harmless.
export function LogoMark({ size = 28, className }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lf-mark-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14A38B" />
          <stop offset="1" stopColor="#0A6152" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8.5" fill="url(#lf-mark-fill)" />
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="7.75"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.16"
        strokeWidth="1.5"
      />
      <path
        d="M9 10.2h5.6M9 16h9.4M9 21.8h14"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="18.6" cy="10.2" r="1.5" fill="#5FD3B5" />
    </svg>
  );
}

type LogoProps = MarkProps & {
  // A second line under the name, e.g. "Platform admin"
  subtitle?: string;
  wordmarkClassName?: string;
};

export function Logo({ size = 28, className, subtitle, wordmarkClassName }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span className="grid text-left leading-tight">
        <span className={cn("font-semibold tracking-tight", wordmarkClassName)}>LedgerFlow</span>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </span>
    </span>
  );
}
