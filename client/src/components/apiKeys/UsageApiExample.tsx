"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHydrated } from "@/hooks/useHydrated";
import CopyButton from "./CopyButton";

// How a customer's app reports usage (endpoint #29), with this site's own URL
export default function UsageApiExample() {
  const hydrated = useHydrated();
  const origin = hydrated ? window.location.origin : "https://<your-ledgerflow-site>";
  const snippet = `curl -X POST ${origin}/api/v1/usage \\
  -H "x-api-key: <your key>" \\
  -H "Content-Type: application/json" \\
  -d '{"metric":"documents_processed","quantity":25,"idempotencyKey":"job-8831-batch-2"}'`;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div className="space-y-1.5">
          <CardTitle>Report usage</CardTitle>
          <CardDescription>
            Send each event once with a unique <code>idempotencyKey</code>; retries with the same
            key are never counted twice.
          </CardDescription>
        </div>
        <CopyButton value={snippet} />
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-md border bg-muted p-3 font-mono text-xs leading-relaxed">
          {snippet}
        </pre>
      </CardContent>
    </Card>
  );
}
