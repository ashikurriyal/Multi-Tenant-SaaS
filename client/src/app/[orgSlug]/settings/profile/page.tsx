"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import PageHeader from "@/components/app/PageHeader";
import FormField from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { getApiError } from "@/lib/api-error";
import { applyFieldErrors } from "@/lib/form-errors";
import { baseApi } from "@/redux/api/baseApi";
import { useChangePasswordMutation, useUpdateMeMutation } from "@/redux/api/userApi";
import { loggedOut } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordValues,
  type ProfileValues,
} from "@/schemas/auth";

// SRS 17.1 /[orgSlug]/settings/profile: everyone, for their own account (FR-USER-02/03)
export default function ProfilePage() {
  const { me, isDemo } = useActiveOrg();
  if (!me) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title="Profile" description={me.email} />
      {isDemo && (
        <p className="text-sm text-muted-foreground">
          Changing the demo users&apos; name or password is turned off, so the next visitor finds
          the demo the same. Create your own free account to try it.
        </p>
      )}
      <NameCard name={me.name} disabled={isDemo} />
      <PasswordCard disabled={isDemo} />
    </div>
  );
}

function NameCard({ name, disabled }: { name: string; disabled: boolean }) {
  const [updateMe, { isLoading }] = useUpdateMeMutation();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), values: { name } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updated = await updateMe(values).unwrap();
      reset({ name: updated.name });
      toast.success("Name updated");
    } catch (err) {
      const apiError = getApiError(err as Parameters<typeof getApiError>[0]);
      if (apiError && !applyFieldErrors(apiError, setError, ["name"])) {
        setError("name", { type: "server", message: apiError.message });
      }
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Name</CardTitle>
        <CardDescription>Shown to the other members of your organizations.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col gap-4 sm:flex-row sm:items-start"
        >
          <div className="flex-1">
            <FormField
              id="profile-name"
              label="Name"
              autoComplete="name"
              disabled={disabled}
              error={errors.name}
              {...register("name")}
            />
          </div>
          <Button
            type="submit"
            className="sm:mt-[22px]"
            disabled={disabled || !isDirty || isLoading}
          >
            {isLoading ? "Saving…" : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordCard({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      // Every session ended on the server, this one too: sign out here and start fresh
      toast.success("Password changed. Log in with your new password.");
      dispatch(loggedOut("/login"));
      dispatch(baseApi.util.resetApiState());
      router.replace("/login");
    } catch (err) {
      const apiError = getApiError(err as Parameters<typeof getApiError>[0]);
      if (apiError && !applyFieldErrors(apiError, setError, ["currentPassword", "newPassword"])) {
        setError("root", { type: apiError.errorCode, message: apiError.message });
      }
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Changing it signs you out everywhere, including this browser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {errors.root?.message && (
            <p className="text-sm text-destructive" role="alert">
              {errors.root.message}
            </p>
          )}
          <FormField
            id="current-password"
            label="Current password"
            type="password"
            autoComplete="current-password"
            disabled={disabled}
            error={errors.currentPassword}
            {...register("currentPassword")}
          />
          <FormField
            id="new-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            disabled={disabled}
            error={errors.newPassword}
            {...register("newPassword")}
          />
          <FormField
            id="confirm-password"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            disabled={disabled}
            error={errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <Button type="submit" disabled={disabled || isLoading}>
            {isLoading ? "Changing…" : "Change password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
