"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRedirectWhenAuthenticated } from "@/hooks/useRedirectWhenAuthenticated";
import { getApiError } from "@/lib/api-error";
import { applyFieldErrors } from "@/lib/form-errors";
import { useLoginMutation } from "@/redux/api/authApi";
import { setCredentials } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { loginSchema, type LoginValues } from "@/schemas/auth";
import AuthChecking from "./AuthChecking";
import FormField from "@/components/forms/FormField";

export default function LoginForm() {
  const dispatch = useAppDispatch();
  const { checking } = useRedirectWhenAuthenticated();
  const [login, { isLoading }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    setError,
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
      // INVALID_CREDENTIALS, USER_BLOCKED and RATE_LIMITED are about the whole form
      if (!applyFieldErrors(apiError, setError, ["email", "password"])) {
        setError("root", { type: "server", message: apiError.message });
      }
    }
  });

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
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
