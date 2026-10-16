"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { getApiError } from "@/lib/api-error";
import { applyFieldErrors } from "@/lib/form-errors";
import { useCreateInvitationMutation } from "@/redux/api/invitationApi";
import { inviteSchema, type InviteValues } from "@/schemas/org";

const ROLE_HELP = {
  ADMIN: "Admin — manage members, API keys and settings",
  BILLING: "Billing — manage the plan and invoices",
  MEMBER: "Member — view dashboards and usage",
} as const;

export default function InviteDialog({ seatsFull }: { seatsFull: boolean }) {
  const { org, can } = useActiveOrg();
  const [open, setOpen] = useState(false);
  const [createInvitation, { isLoading }] = useCreateInvitationMutation();
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "MEMBER" },
  });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!org) return;
    try {
      await createInvitation({ orgId: org.id, ...values }).unwrap();
      toast.success(`Invitation sent to ${values.email}`);
      onOpenChange(false);
    } catch (err) {
      const apiError = getApiError(err as Parameters<typeof getApiError>[0]);
      if (!apiError) return;
      // CONFLICT = already a member → belongs to the email field
      if (!applyFieldErrors(apiError, setError, ["email", "role"], { CONFLICT: "email" })) {
        setError("root", { type: apiError.errorCode, message: apiError.message });
      }
    }
  });

  const seatError = errors.root?.type === "PLAN_LIMIT_SEATS";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus />
          Invite member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
          <DialogDescription>
            They&apos;ll get an email with a link that is valid for 7 days.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {(seatsFull || errors.root) && (
            <Alert variant={seatError || seatsFull ? "default" : "destructive"}>
              <AlertCircle />
              <AlertTitle>
                {seatError || seatsFull ? "Seat limit reached" : "Couldn't send"}
              </AlertTitle>
              <AlertDescription>
                {errors.root?.message ??
                  "All seats on your plan are in use. Upgrade your plan or remove a member to invite someone new."}
                {(seatError || seatsFull) && org && can("billing:manage") && (
                  <>
                    {" "}
                    <Link
                      href={`/${org.slug}/billing`}
                      className="font-medium underline underline-offset-4"
                    >
                      View plans
                    </Link>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          <FormField
            id="invite-email"
            label="Email"
            type="email"
            autoComplete="off"
            error={errors.email}
            {...register("email")}
          />
          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="invite-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_HELP) as (keyof typeof ROLE_HELP)[]).map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_HELP[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sending…" : "Send invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
