"use client";

import { Button } from "@/components/ui/button";
import type { ApiMeta } from "@/types/api";

type Props = { meta: ApiMeta; noun: string; onPage: (page: number) => void };

export default function Pager({ meta, noun, onPage }: Props) {
  if (meta.totalPages <= 1) {
    return (
      <p className="text-sm text-muted-foreground">
        {meta.total} {noun}
      </p>
    );
  }
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Page {meta.page} of {meta.totalPages} · {meta.total} {noun}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page <= 1}
          onClick={() => onPage(meta.page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
