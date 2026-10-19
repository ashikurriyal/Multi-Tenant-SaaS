"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import FormField from "@/components/forms/FormField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getApiError } from "@/lib/api-error";
import { applyFieldErrors } from "@/lib/form-errors";
import { baseApi } from "@/redux/api/baseApi";
import { useResetPasswordMutation } from "@/redux/api/authApi";
import { loggedOut } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { resetPasswordSchema, type ResetPasswordValues } from "@/schemas/auth";

// FR-AUTH-17: new password from the emailed link; every session ends, then log in again
export default function ResetPasswordForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useSearchParams().get("token");
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  if (!token) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>
            This reset link is incomplete. Open the link from your email again.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="w-full">
          <Link href="/forgot-password">Get a new link</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = handleSubmit(async ({ password }) => {
    try {
      const { message } = await resetPassword({ token, password }).unwrap();
      // The server ended every session, including any in this browser
      dispatch(loggedOut());
      dispatch(baseApi.util.resetApiState());
      toast.success(message);
      router.replace("/login");
    } catch (err) {
      const apiError = getApiError(err as Parameters<typeof getApiError>[0]);
      if (!apiError) return;
      if (!applyFieldErrors(apiError, setError, ["password"])) {
        setError("root", { type: apiError.errorCode, message: apiError.message });
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {errors.root?.message && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>
            {errors.root.message}{" "}
            {errors.root.type === "TOKEN_EXPIRED" && (
              <Link href="/forgot-password" className="font-medium underline underline-offset-4">
                Get a new link
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}
      <FormField
        id="password"
        icon={LockKeyhole}
        label="New password"
        type="password"
        autoComplete="new-password"
        error={errors.password}
        {...register("password")}
      />
      <FormField
        id="confirmPassword"
        icon={LockKeyhole}
        label="Repeat new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword}
        {...register("confirmPassword")}
      />
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
