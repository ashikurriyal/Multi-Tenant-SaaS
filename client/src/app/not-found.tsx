import type { Metadata } from "next";
import StatusScreen from "@/components/states/StatusScreen";

export const metadata: Metadata = { title: "Page not found · LedgerFlow" };

// Also shown for organizations you don't belong to, the same answer the API gives (FR-ORG-02)
export default function NotFound() {
  return (
    <StatusScreen
      code="404"
      title="Page not found"
      message="This page doesn't exist, or you don't have access to it."
    />
  );
}
