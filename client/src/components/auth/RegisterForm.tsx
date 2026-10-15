"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRedirectWhenAuthenticated } from "@/hooks/useRedirectWhenAuthenticated";
import { getApiError } from "@/lib/api-error";
import { applyFieldErrors } from "@/lib/form-errors";
import { useLoginMutation, useRegisterMutation } from "@/redux/api/authApi";
import { setCredentials } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { registerSchema, type RegisterValues } from "@/schemas/auth";
import AuthChecking from "./AuthChecking";
import FormField from "@/components/forms/FormField";

const FIELDS = ["name", "email", "password", "organizationName"] as const;

export default function RegisterForm() {
  const dispatch = useAppDispatch();
  const { checking } = useRedirectWhenAuthenticated();
  const [registerAccount] = useRegisterMutation();
  const [login] = useLoginMutation();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    // Prefilled when coming from an invitation (/register?email=…)
    defaultValues: { email: useSearchParams().get("email") ?? "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await registerAccount(values).unwrap();
      // Registration doesn't start a session, so log in with the same credentials
      const session = await login({ email: values.email, password: values.password }).unwrap();
      dispatch(setCredentials(session));
    } catch (err) {
      setSubmitting(false);
      const apiError = getApiError(err as Parameters<typeof getApiError>[0]);
      if (!apiError) return;
      if (!applyFieldErrors(apiError, setError, FIELDS, { EMAIL_TAKEN: "email" })) {
        setError("root", { type: "server", message: apiError.message });
      }
    }
  });

  if (checking && !submitting) return <AuthChecking />;

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
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Creating your account…" : "Create account"}
      </Button>
    </form>
  );
}
