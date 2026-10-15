import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { message?: string; onRetry?: () => void };

export default function ErrorState({ message = "Something went wrong.", onRetry }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
      <AlertCircle className="size-6 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
