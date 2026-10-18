import ErrorState from "@/components/states/ErrorState";

// Shown by the signed-in guards when /users/me fails (see useSessionGate)
export default function SessionLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-md p-8">
      <ErrorState
        message="Couldn't load your account. Check your connection and try again."
        onRetry={onRetry}
      />
    </div>
  );
}
