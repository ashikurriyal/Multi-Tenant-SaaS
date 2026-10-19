import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "@/components/auth/RegisterForm";

// Validated for instant navigation (see next.config.ts)
export const instant = true;

export const metadata: Metadata = { title: "Create account · LedgerFlow" };

export default function RegisterPage() {
  return (
    <AuthShell
      tabs
      title="Create your account"
      description="Start on the Free plan. Invite your team and upgrade whenever you're ready."
      footer={
        <span>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </span>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
