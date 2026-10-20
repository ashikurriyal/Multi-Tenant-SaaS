import type { Scene } from "./script";

// The browser chrome above the app: dots and the address of the current page
export default function BrowserBar({ scene }: { scene: Scene["scene"] }) {
  return (
    <div className="flex h-[2.6em] items-center gap-[0.5em] border-b border-divider bg-surface px-[1em]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-[0.7em] rounded-full bg-[#E2E8E6]" />
      ))}
      <span className="ml-[0.8em] inline-flex h-[1.6em] items-center rounded-[0.45em] border border-line bg-white px-[0.8em]">
        <span className="font-mono text-[0.7em] leading-none text-subtle">
          ledgerflow-web-portal.vercel.app/demo-initech/{scene === "dash" ? "dashboard" : "billing"}
        </span>
      </span>
    </div>
  );
}
