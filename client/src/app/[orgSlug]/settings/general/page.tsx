"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import PageHeader from "@/components/app/PageHeader";
import FormField from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { getApiError } from "@/lib/api-error";
import { applyFieldErrors } from "@/lib/form-errors";
import { useUpdateOrganizationMutation } from "@/redux/api/orgApi";
import { organizationNameSchema, type OrganizationNameValues } from "@/schemas/org";

// FR-ORG-04: rename (org:update); the slug never changes
export default function GeneralSettingsPage() {
  const { org, can } = useActiveOrg();
  const [update, { isLoading }] = useUpdateOrganizationMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
    reset,
  } = useForm<OrganizationNameValues>({
    resolver: zodResolver(organizationNameSchema),
    values: { name: org?.name ?? "" },
  });

  if (!org) return null;
  if (!can("org:update")) {
    return (
      <p className="text-sm text-muted-foreground">
        Only owners and admins can change organization settings.
      </p>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updated = await update({ orgId: org.id, name: values.name }).unwrap();
      reset({ name: updated.name });
      toast.success("Organization renamed");
    } catch (err) {
      const apiError = getApiError(err as Parameters<typeof getApiError>[0]);
      if (apiError && !applyFieldErrors(apiError, setError, ["name"])) {
        setError("name", { type: "server", message: apiError.message });
      }
    }
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title="General" description="Settings for this organization." />
      <Card>
        <CardHeader>
          <CardTitle>Organization name</CardTitle>
          <CardDescription>
            The URL stays <span className="font-mono">/{org.slug}</span> after renaming.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={onSubmit}
            noValidate
            className="flex flex-col gap-4 sm:flex-row sm:items-start"
          >
            <div className="flex-1">
              <FormField id="org-name" label="Name" error={errors.name} {...register("name")} />
            </div>
            <Button type="submit" className="sm:mt-[22px]" disabled={!isDirty || isLoading}>
              {isLoading ? "Saving…" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
