import type { Metadata } from "next";
import CreateOrganizationForm from "@/components/app/CreateOrganizationForm";
import RequireAuth from "@/components/auth/RequireAuth";
import { Logo } from "@/components/brand/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Create an organization · LedgerFlow" };

// Where signed-in users without any organization land (e.g. after leaving their last one)
export default function OnboardingPage() {
  return (
    <RequireAuth>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
        <Logo size={32} wordmarkClassName="text-xl" />
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Create an organization</CardTitle>
            <CardDescription>
              You&apos;re not part of any organization yet. Create one to get started, or open an
              invitation link you received.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateOrganizationForm />
          </CardContent>
        </Card>
      </main>
    </RequireAuth>
  );
}
