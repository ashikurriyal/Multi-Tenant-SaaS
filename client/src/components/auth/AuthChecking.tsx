import { Skeleton } from "@/components/ui/skeleton";

// Placeholder while the session is restored, so a logged-in user never sees the form flash
export default function AuthChecking() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Checking your session">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
