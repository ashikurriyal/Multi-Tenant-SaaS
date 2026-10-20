import { cn } from "@/lib/utils";
import type { Scene } from "./script";

// The app's sidebar; the current page's link is highlighted
const NAV: { label: string; scene?: Scene["scene"]; heading?: boolean }[] = [
  { label: "Dashboard", scene: "dash" },
  { label: "Usage" },
  { label: "Billing", scene: "billing" },
  { label: "Settings", heading: true },
  { label: "Members" },
  { label: "API keys" },
  { label: "Audit log" },
];

export default function Sidebar({ scene }: { scene: Scene["scene"] }) {
  return (
    <div className="flex w-[13em] flex-none flex-col border-r border-line bg-surface px-[0.75em] py-[1em]">
      <div className="flex h-[3.5em] items-center gap-[0.6em] px-[0.5em]">
        <span className="inline-flex size-[2em] flex-none items-center justify-center rounded-[0.5em] bg-ink">
          <span className="text-[0.68em] leading-none font-semibold text-white">IN</span>
        </span>
        <span className="flex flex-col gap-[0.2em]">
          <span className="text-[0.8em] leading-none font-semibold">Initech</span>
          <span className="text-[0.66em] leading-none text-subtle">owner</span>
        </span>
      </div>
      {NAV.map((n) =>
        n.heading ? (
          <div key={n.label} className="flex h-[2.2em] items-end px-[0.7em] pb-[0.4em]">
            <span className="text-[0.64em] leading-none text-subtle">{n.label}</span>
          </div>
        ) : (
          <div
            key={n.label}
            className={cn(
              "flex h-[2.2em] items-center rounded-[0.5em] px-[0.7em] transition-[background-color] duration-250",
              n.scene === scene && "bg-[#E3E9E7] font-semibold",
            )}
          >
            <span className="text-[0.78em] leading-none">{n.label}</span>
          </div>
        ),
      )}
      <div className="mt-auto flex items-center gap-[0.6em] px-[0.5em]">
        <span className="inline-flex size-[1.9em] flex-none items-center justify-center rounded-[0.45em] bg-[#E9EEEC]">
          <span className="text-[0.68em] leading-none">P</span>
        </span>
        <span className="flex min-w-0 flex-col gap-[0.25em]">
          <span className="text-[0.72em] leading-none font-semibold">Priya Singh</span>
          <span className="text-[0.6em] leading-none text-subtle">priya.singh@initech.example</span>
        </span>
      </div>
    </div>
  );
}
