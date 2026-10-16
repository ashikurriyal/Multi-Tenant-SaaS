import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResendVerificationButton from "./ResendVerificationButton";

type Props = { email: string; next?: string; onStartOver: () => void };

// Shown after registering: the account can't be used until the email link is clicked
export default function CheckInbox({ email, next, onStartOver }: Props) {
  return (
    <div className="space-y-4 text-center">
      <MailCheck className="mx-auto size-10 text-primary" />
      <div className="space-y-1">
        <p className="font-medium">Check your inbox</p>
        <p className="text-sm text-muted-foreground">
          We sent a verification link to{" "}
          <span className="font-medium text-foreground">{email}</span>. Click it to finish creating
          your account. The link is valid for 24 hours.
        </p>
        <p className="text-xs text-muted-foreground">Can&apos;t find it? Check your spam folder.</p>
      </div>
      <ResendVerificationButton email={email} next={next} startCoolingDown />
      <Button type="button" variant="ghost" className="w-full" onClick={onStartOver}>
        Wrong email? Start over
      </Button>
    </div>
  );
}
