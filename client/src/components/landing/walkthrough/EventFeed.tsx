import { cn } from "@/lib/utils";
import type { FeedEntry } from "./script";

// The API requests coming in; older lines fade out
export default function EventFeed({ feed }: { feed: FeedEntry[] }) {
  return (
    <div className="flex min-h-0 flex-col gap-[0.7em] overflow-hidden rounded-[0.8em] bg-ink px-[1.1em] py-[1em]">
      <div className="flex items-center justify-between gap-[0.6em] pb-[0.2em]">
        <span className="inline-flex items-center gap-[0.5em]">
          <span className="size-[0.45em] animate-live rounded-full bg-mint" />
          <span className="font-mono text-[0.66em] leading-none tracking-[0.06em] text-sage">
            LIVE API EVENTS
          </span>
        </span>
        <span className="font-mono text-[0.62em] leading-none text-moss">POST /api/v1/usage</span>
      </div>
      {feed.map((e, i) => (
        <div
          key={i}
          style={{ opacity: Math.max(0.35, 1 - i * 0.11) }}
          className="grid grid-cols-[3.1em_minmax(0,1fr)_2.4em] items-center gap-[0.6em]"
        >
          <span
            className={cn(
              "inline-flex h-[1.55em] items-center justify-center rounded-[0.35em]",
              e.code === "429" ? "bg-[#E8B04B]/16" : "bg-mint/14",
            )}
          >
            <span
              className={cn(
                "font-mono text-[0.64em] leading-none font-semibold",
                e.code === "429" ? "text-[#E8B04B]" : "text-mint",
              )}
            >
              {e.code}
            </span>
          </span>
          <span className="overflow-hidden font-mono text-[0.66em] leading-none text-ellipsis whitespace-nowrap text-fog">
            {e.text}
          </span>
          <span className="text-right font-mono text-[0.6em] leading-none text-moss">
            {i === 0 ? "now" : i * 2 + "s"}
          </span>
        </div>
      ))}
    </div>
  );
}
