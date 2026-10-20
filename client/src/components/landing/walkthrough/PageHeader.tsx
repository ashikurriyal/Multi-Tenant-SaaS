import { cn } from "@/lib/utils";
import type { Scene } from "./script";

// Page title and the workspace's plan chip (Free, then Pro once the upgrade lands)
export default function PageHeader({ scene, pro }: { scene: Scene["scene"]; pro: boolean }) {
  return (
    <div className="flex min-h-[2.6em] items-center justify-between gap-[1em]">
      <div className="flex flex-col gap-[0.4em]">
        <span className="text-[1.4em] leading-none font-[650] tracking-[-0.02em]">
          {scene === "dash" ? "Dashboard" : "Billing"}
        </span>
        <span className="text-[0.74em] leading-none text-subtle">Initech</span>
      </div>
      <span
        className={cn(
          "inline-flex h-[1.9em] items-center gap-[0.45em] rounded-full px-[0.85em] transition-[background-color] duration-300",
          pro ? "bg-primary/12" : "bg-line-soft",
        )}
      >
        <span className={cn("size-[0.45em] rounded-full", pro ? "bg-primary" : "bg-[#8C9B97]")} />
        <span
          className={cn(
            "text-[0.68em] leading-none font-semibold tracking-[0.04em]",
            pro ? "text-brand-deep" : "text-[#3F4B52]",
          )}
        >
          {pro ? "PRO · ACTIVE" : "FREE"}
        </span>
      </span>
    </div>
  );
}
