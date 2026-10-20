import { cn } from "@/lib/utils";

// The scripted pointer: it glides between buttons, presses in on click and ripples
export default function Cursor({
  x,
  y,
  clicking,
  pressed,
}: {
  x: number;
  y: number;
  clicking: boolean;
  pressed: boolean;
}) {
  return (
    <div
      style={{ transform: `translate(${Math.round(x)}px, ${Math.round(y)}px)` }}
      className="pointer-events-none absolute top-0 left-0 z-6 transition-transform duration-950 ease-[cubic-bezier(0.22,1,0.36,1)]"
    >
      {clicking && (
        <span className="absolute top-[-1.3em] left-[-1.3em] size-[2.6em] animate-click rounded-full bg-primary/28" />
      )}
      <div
        className={cn(
          "relative origin-top-left transition-transform duration-140 ease-[ease]",
          pressed && "scale-86",
        )}
      >
        <svg
          width="1.3em"
          height="1.3em"
          viewBox="0 0 20 20"
          className="block drop-shadow-[0_0.12em_0.22em_rgba(11,18,21,0.35)]"
        >
          <path
            d="M3 2.2l13.6 5.7c.8.3.7 1.4-.1 1.6l-5.6 1.5-2.3 5.4c-.3.8-1.4.7-1.6-.1L2.2 3.1c-.2-.6.3-1.1.8-.9z"
            fill="var(--color-primary)"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <span className="absolute top-[1.15em] left-[1.15em] inline-flex h-[1.55em] items-center rounded-full bg-primary px-[0.6em] whitespace-nowrap shadow-[0_0.35em_0.9em_-0.35em_rgba(11,18,21,0.45)]">
          <span className="text-[0.64em] leading-none font-semibold text-white">Owner</span>
        </span>
      </div>
    </div>
  );
}
