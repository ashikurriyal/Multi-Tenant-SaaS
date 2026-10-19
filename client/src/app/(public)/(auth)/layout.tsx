import Link from "next/link";
import AuthShowcase from "@/components/auth/AuthShowcase";
import { Logo } from "@/components/brand/Logo";
import "@/components/auth/auth.css";

// Shared frame for log in, sign up and the other account pages: the form on the left and a
// brand panel on the right. Being a layout, it stays mounted when switching between log in
// and sign up, so only the form changes.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-frame grid flex-1 lg:min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="relative flex min-h-dvh flex-col px-5 py-5 sm:px-10 sm:py-7">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="LedgerFlow home" className="rounded-md">
            <Logo size={30} wordmarkClassName="text-lg" />
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Back to site
          </Link>
        </header>
        {children}
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© 2026 LedgerFlow</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
            Payments run in Stripe test mode
          </span>
        </footer>
      </div>
      <AuthShowcase />
    </div>
  );
}
