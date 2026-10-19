import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import VerifyEmailView from "@/components/auth/VerifyEmailView";

export const metadata: Metadata = { title: "Verify email · LedgerFlow" };

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Verify your email"
      description="Confirming the link from your email."
      footer={<span>Verification links are valid for 24 hours.</span>}
    >
      <VerifyEmailView />
    </AuthShell>
  );
}
