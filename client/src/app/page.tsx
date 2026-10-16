import Link from "next/link";

// Validated for instant navigation (see next.config.ts)
export const instant = true;

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">LedgerFlow</h1>
      <p className="max-w-md text-foreground/70">Multi-tenant SaaS billing and usage analytics.</p>
      <div className="flex gap-4 pt-2 text-sm">
        <Link href="/pricing" className="underline-offset-4 hover:underline">
          Pricing
        </Link>
        <Link href="/login" className="underline-offset-4 hover:underline">
          Log in
        </Link>
        <Link href="/register" className="font-medium underline-offset-4 hover:underline">
          Get started
        </Link>
      </div>
    </main>
  );
}
