"use client";

import { useState } from "react";

/**
 * True from the first time `settled` is true for this `key`, and it stays true.
 *
 * Gates that show content only once a request has finished must not flip back while that
 * request is retried: RTK Query re-fetches a failed request whenever a new component
 * subscribes to it, so a gate that hides and re-mounts subscribers on every retry loops
 * forever (seen as hundreds of requests a second). Latching per key (e.g. the
 * organization id) avoids that and still resets when the key changes.
 */
export function useSettledOnce(key: string | null | undefined, settled: boolean) {
  const [settledKey, setSettledKey] = useState<string | null>(null);
  if (key && settled && settledKey !== key) setSettledKey(key);
  return Boolean(key) && (settledKey === key || settled);
}
