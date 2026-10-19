import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";
import PlanFeatures from "@/components/billing/PlanFeatures";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import type { ApiResponse, Plan } from "@/types/api";

export const metadata: Metadata = {
  title: "Pricing · LedgerFlow",
  description: "Free, Pro and Business plans with metered usage.",
};

// Validated for instant navigation (see next.config.ts): the shell is static, plans stream in
export const instant = true;

// FR-PLAN-01. Fetched per request on the server (not at build time, so builds and CI never
// need the API); the API marks the response cacheable for 5 minutes
async function PricingPlans() {
  await connection();
  let plans: Plan[] | null = null;
  try {
    const res = await fetch(`${process.env.API_URL ?? "http://localhost:5050"}/api/v1/plans`);
    if (res.ok) plans = ((await res.json()) as ApiResponse<Plan[]>).data;
  } catch {
    plans = null;
  }

  if (!plans) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Pricing is unavailable right now. You can still{" "}
        <Link href="/register" className="underline underline-offset-4">
          start on the Free plan
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <Card key={plan.code} className={plan.code === "PRO" ? "border-primary" : undefined}>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>
              <span className="text-3xl font-semibold text-foreground">
                {formatMoney(plan.monthlyPriceCents)}
              </span>{" "}
              / month
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <PlanFeatures plan={plan} />
          </CardContent>
          <CardFooter>
            <Button
              asChild
              className="w-full"
              variant={plan.code === "PRO" ? "default" : "outline"}
            >
              <Link href="/register">
                {plan.code === "FREE" ? "Start free" : `Start with ${plan.name}`}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-16">
      <div className="space-y-3 text-center">
        <Link href="/" className="mx-auto flex w-fit" aria-label="LedgerFlow home">
          <Logo size={28} />
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight">Simple, usage-based pricing</h1>
        <p className="text-muted-foreground">
          Every account starts free. Paid plans include more seats and usage, with fair overage.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-72 w-full" />
            ))}
          </div>
        }
      >
        <PricingPlans />
      </Suspense>
      <p className="text-center text-xs text-muted-foreground">
        Test mode: use card 4242 4242 4242 4242, any future date and any CVC.
      </p>
    </main>
  );
}
