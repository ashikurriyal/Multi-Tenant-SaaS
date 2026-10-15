"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import FormField from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { getApiError } from "@/lib/api-error";
import { applyFieldErrors } from "@/lib/form-errors";
import { orgHomePath } from "@/lib/redirects";
import { useCreateOrganizationMutation } from "@/redux/api/orgApi";
import { organizationNameSchema, type OrganizationNameValues } from "@/schemas/org";

// FR-ORG-01: the creator becomes OWNER and the organization starts on the Free plan
export default function CreateOrganizationForm({ onCreated }: { onCreated?: () => void }) {
  const router = useRouter();
  const [createOrganization, { isLoading }] = useCreateOrganizationMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OrganizationNameValues>({ resolver: zodResolver(organizationNameSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const org = await createOrganization(values).unwrap();
      toast.success(`${org.name} created`);
      onCreated?.();
      router.push(orgHomePath(org.slug));
    } catch (err) {
      const apiError = getApiError(err as Parameters<typeof getApiError>[0]);
      if (apiError && !applyFieldErrors(apiError, setError, ["name"])) {
        setError("name", { type: "server", message: apiError.message });
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormField
        id="org-name"
        label="Organization name"
        autoComplete="organization"
        error={errors.name}
        {...register("name")}
      />
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating…" : "Create organization"}
      </Button>
    </form>
  );
}
