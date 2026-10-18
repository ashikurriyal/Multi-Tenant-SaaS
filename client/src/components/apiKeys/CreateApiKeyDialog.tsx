"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, KeyRound, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import FormField from "@/components/forms/FormField";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { getApiError } from "@/lib/api-error";
import { applyFieldErrors } from "@/lib/form-errors";
import { useCreateApiKeyMutation } from "@/redux/api/apiKeyApi";
import { apiKeySchema, type ApiKeyValues } from "@/schemas/org";
import type { CreatedApiKey } from "@/types/api";
import CopyButton from "./CopyButton";

/**
 * FR-KEY-01…03: name → create → the full key is shown once, here. It lives only in this
 * component's state and is gone when the dialog closes; the server stores only its hash.
 */
export default function CreateApiKeyDialog({ limitReached }: { limitReached: boolean }) {
  const { org } = useActiveOrg();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<CreatedApiKey | null>(null);
  const [createKey, { isLoading }] = useCreateApiKeyMutation();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ApiKeyValues>({ resolver: zodResolver(apiKeySchema), defaultValues: { name: "" } });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setCreated(null);
      reset();
    }
  };

  const onSubmit = handleSubmit(async ({ name }) => {
    if (!org) return;
    try {
      setCreated(await createKey({ orgId: org.id, name }).unwrap());
    } catch (err) {
      const apiError = getApiError(err as Parameters<typeof getApiError>[0]);
      if (apiError && !applyFieldErrors(apiError, setError, ["name"])) {
        setError("root", { type: apiError.errorCode, message: apiError.message });
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={limitReached} title={limitReached ? "Revoke a key first" : undefined}>
          <Plus />
          Create API key
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg"
        // Don't lose the key to a stray click outside the dialog
        onInteractOutside={(e) => created && e.preventDefault()}
      >
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="size-5" />
                {created.name}
              </DialogTitle>
              <DialogDescription>
                Copy this key now and store it somewhere safe. It won&apos;t be shown again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <code
                className="block rounded-md border bg-muted px-3 py-2 font-mono text-sm break-all select-all"
                aria-label="API key"
              >
                {created.key}
              </code>
              <CopyButton value={created.key} label="Copy key" />
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>I&apos;ve copied it</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create an API key</DialogTitle>
              <DialogDescription>
                Your app sends it in the <code>x-api-key</code> header when it reports usage.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              {errors.root && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Couldn&apos;t create the key</AlertTitle>
                  <AlertDescription>{errors.root.message}</AlertDescription>
                </Alert>
              )}
              <FormField
                id="api-key-name"
                label="Name"
                placeholder="e.g. Production server"
                autoComplete="off"
                error={errors.name}
                {...register("name")}
              />
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating…" : "Create key"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
