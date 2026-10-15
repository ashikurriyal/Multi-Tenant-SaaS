import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

// Validated for instant navigation (see next.config.ts)
export const instant = true;

export const metadata: Metadata = { title: "Log in · LedgerFlow" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Log in"
      description="Welcome back. Log in to your LedgerFlow account."
      footer={
        <span>
          New to LedgerFlow?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </span>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
