"use client";

import { useEffect } from "react";
import StatusScreen from "@/components/states/StatusScreen";
import { Button } from "@/components/ui/button";

// Any unexpected error while rendering a page: a message and a way to retry, instead of
// the browser's bare "Application error" screen
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      title="Something went wrong"
      message={`This page hit an unexpected error. Try again; if it keeps happening, reload the page.${error.digest ? ` (Reference: ${error.digest})` : ""}`}
      action={<Button onClick={() => retry()}>Try again</Button>}
    />
  );
}
