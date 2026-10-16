import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password · LedgerFlow" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      description="You'll be logged out everywhere and can log in with the new password."
      footer={<span>Reset links are valid for 1 hour.</span>}
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
