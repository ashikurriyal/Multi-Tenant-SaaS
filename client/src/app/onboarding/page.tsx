import type { Metadata } from "next";
import CreateOrganizationForm from "@/components/app/CreateOrganizationForm";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Create an organization · LedgerFlow" };

// Where signed-in users without any organization land (e.g. after leaving their last one)
export default function OnboardingPage() {
  return (
    <RequireAuth>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
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
