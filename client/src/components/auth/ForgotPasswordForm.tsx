"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import FormField from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { getApiError } from "@/lib/api-error";
import { useForgotPasswordMutation } from "@/redux/api/authApi";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/schemas/auth";

// FR-AUTH-16 — the answer is the same whether or not the address has an account
export default function ForgotPasswordForm() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { message } = await forgotPassword(values).unwrap();
      setSentMessage(message);
    } catch (err) {
      const apiError = getApiError(err as Parameters<typeof getApiError>[0]);
      setError("email", { type: "server", message: apiError?.message ?? "Something went wrong" });
    }
  });

  if (sentMessage) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="mx-auto size-10 text-primary" />
        <p className="text-sm text-muted-foreground">{sentMessage}</p>
        <p className="text-xs text-muted-foreground">
          The link is valid for 1 hour. Can&apos;t find it? Check your spam folder.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormField
        id="email"
        icon={Mail}
        placeholder="you@company.com"
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email}
        {...register("email")}
      />
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
