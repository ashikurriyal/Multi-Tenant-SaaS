"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRedirectWhenAuthenticated } from "@/hooks/useRedirectWhenAuthenticated";
import { getApiError } from "@/lib/api-error";
import { applyFieldErrors } from "@/lib/form-errors";
import { safeNextPath } from "@/lib/redirects";
import { useLoginMutation } from "@/redux/api/authApi";
import { setCredentials } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { loginSchema, type LoginValues } from "@/schemas/auth";
import AuthChecking from "./AuthChecking";
import DemoAccounts from "./DemoAccounts";
import ResendVerificationButton from "./ResendVerificationButton";
import FormField from "@/components/forms/FormField";

export default function LoginForm() {
  const dispatch = useAppDispatch();
  const next = safeNextPath(useSearchParams().get("next")) ?? undefined;
  const { checking } = useRedirectWhenAuthenticated();
  const [login, { isLoading }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await login(values).unwrap();
      // useRedirectWhenAuthenticated takes it from here
      dispatch(setCredentials(result));
    } catch (err) {
      const apiError = getApiError(err as Parameters<typeof getApiError>[0]);
      if (!apiError) return;
      // INVALID_CREDENTIALS, EMAIL_NOT_VERIFIED, USER_BLOCKED and RATE_LIMITED: whole form
      if (!applyFieldErrors(apiError, setError, ["email", "password"])) {
        setError("root", { type: apiError.errorCode, message: apiError.message });
      }
    }
  });

  if (checking && !isLoading) return <AuthChecking />;

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {errors.root?.type === "EMAIL_NOT_VERIFIED" ? (
          <div className="space-y-3">
            <Alert>
              <AlertCircle />
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
            <ResendVerificationButton email={getValues("email")} next={next} />
          </div>
        ) : (
          errors.root?.message && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )
        )}
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email}
          {...register("email")}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password}
          {...register("password")}
        />
        <div className="-mt-2 text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Logging in…" : "Log in"}
        </Button>
      </form>
      <DemoAccounts />
    </div>
  );
}
