"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import FormField from "@/components/forms/FormField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRedirectWhenAuthenticated } from "@/hooks/useRedirectWhenAuthenticated";
import { getApiError } from "@/lib/api-error";
import { applyFieldErrors } from "@/lib/form-errors";
import { inviteTokenFromNext, safeNextPath } from "@/lib/redirects";
import { useRegisterMutation } from "@/redux/api/authApi";
import { setCredentials } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { registerSchema, type RegisterValues } from "@/schemas/auth";
import AuthChecking from "./AuthChecking";
import CheckInbox from "./CheckInbox";

const FIELDS = ["name", "email", "password", "organizationName"] as const;

export default function RegisterForm() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next")) ?? undefined;
  const { checking } = useRedirectWhenAuthenticated();
  const [registerAccount, { isLoading }] = useRegisterMutation();
  // Set after a successful sign-up that still needs the email link (FR-AUTH-12)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    // Prefilled when coming from an invitation (/register?email=…)
    defaultValues: { email: searchParams.get("email") ?? "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await registerAccount({
        ...values,
        inviteToken: inviteTokenFromNext(next),
        next,
      }).unwrap();

      if (result.verificationRequired) {
        setPendingEmail(values.email);
      } else {
        // Invited address: verified already. useRedirectWhenAuthenticated takes over
        dispatch(setCredentials({ accessToken: result.accessToken, user: result.user }));
      }
    } catch (err) {
      const apiError = getApiError(err as Parameters<typeof getApiError>[0]);
      if (!apiError) return;
      if (!applyFieldErrors(apiError, setError, FIELDS, { EMAIL_TAKEN: "email" })) {
        setError("root", { type: "server", message: apiError.message });
      }
    }
  });

  if (pendingEmail) {
    return (
      <CheckInbox
        email={pendingEmail}
        next={next}
        onStartOver={() => {
          setPendingEmail(null);
          reset({ email: "" });
        }}
      />
    );
  }
  if (checking && !isLoading) return <AuthChecking />;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {errors.root?.message && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}
      <FormField
        id="name"
        label="Your name"
        autoComplete="name"
        error={errors.name}
        {...register("name")}
      />
      <FormField
        id="email"
        label="Work email"
        type="email"
        autoComplete="email"
        error={errors.email}
        {...register("email")}
      />
      <FormField
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password}
        {...register("password")}
      />
      <FormField
        id="organizationName"
        label="Company name"
        autoComplete="organization"
        error={errors.organizationName}
        {...register("organizationName")}
      />
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating your account…" : "Create account"}
      </Button>
    </form>
  );
}
