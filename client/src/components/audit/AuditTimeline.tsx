"use client";

import { formatDay } from "@/lib/format";
import type { AuditEntry } from "@/types/api";
import { actorLabel, describeAudit } from "./describeAudit";

const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const dayKey = (iso: string) => {
  const d = new Date(iso);
  // Grouped by the viewer's local day
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type Props = { entries: AuditEntry[]; meId?: string; today: string; yesterday: string };

// Newest first, grouped by day; each entry is one readable sentence plus who and when
export default function AuditTimeline({ entries, meId, today, yesterday }: Props) {
  const groups: { day: string; items: AuditEntry[] }[] = [];
  for (const entry of entries) {
    const day = dayKey(entry.createdAt);
    const last = groups.at(-1);
    if (last?.day === day) last.items.push(entry);
    else groups.push({ day, items: [entry] });
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.day} aria-labelledby={`audit-${group.day}`} className="space-y-3">
          <h2 id={`audit-${group.day}`} className="text-sm font-medium text-muted-foreground">
            {group.day === today
              ? "Today"
              : group.day === yesterday
                ? "Yesterday"
                : formatDay(group.day, true)}
          </h2>
          <ol className="space-y-0 border-l pl-6">
            {group.items.map((entry) => {
              const { icon: Icon, sentence } = describeAudit(entry, meId);
              return (
                <li key={entry.id} className="relative pb-5 last:pb-0">
                  <span className="absolute top-0.5 -left-9.25 flex size-6 items-center justify-center rounded-full border bg-background">
                    <Icon className="size-3.5 text-muted-foreground" aria-hidden />
                  </span>
                  <p className="text-sm text-muted-foreground">{sentence}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <time dateTime={entry.createdAt}>{time.format(new Date(entry.createdAt))}</time>
                    {" · "}
                    {actorLabel(entry)}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
