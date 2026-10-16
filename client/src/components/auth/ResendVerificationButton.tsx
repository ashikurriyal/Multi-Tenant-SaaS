"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getApiError } from "@/lib/api-error";
import { useResendVerificationMutation } from "@/redux/api/authApi";

const COOLDOWN_SECONDS = 60; // same as the server's per-account cooldown

type Props = {
  email: string;
  next?: string;
  // Start counting down right away, e.g. just after registering (an email was just sent)
  startCoolingDown?: boolean;
  variant?: "default" | "outline";
};

export default function ResendVerificationButton({
  email,
  next,
  startCoolingDown = false,
  variant = "outline",
}: Props) {
  const [resend, { isLoading }] = useResendVerificationMutation();
  const [secondsLeft, setSecondsLeft] = useState(startCoolingDown ? COOLDOWN_SECONDS : 0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const onClick = async () => {
    try {
      const { message } = await resend({ email, next }).unwrap();
      toast.success(message);
      setSecondsLeft(COOLDOWN_SECONDS);
    } catch (err) {
      // e.g. 429 RATE_LIMITED
      toast.error(getApiError(err as Parameters<typeof getApiError>[0])?.message);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      className="w-full"
      onClick={onClick}
      disabled={!email || isLoading || secondsLeft > 0}
    >
      {isLoading
        ? "Sending…"
        : secondsLeft > 0
          ? `Resend email in ${secondsLeft}s`
          : "Resend verification email"}
    </Button>
  );
}
