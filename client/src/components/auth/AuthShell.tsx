import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
};

export default function AuthShell({ title, description, footer, children }: Props) {
  return (
    // Anchored to the top, not vertically centered: the card grows when the session check
    // finishes (and the demo list loads), and a centered card would jump up (CLS)
    <main className="flex flex-1 items-start justify-center px-4 py-12 sm:pt-20">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="block text-center text-xl font-semibold tracking-tight">
          LedgerFlow
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
          <CardFooter className="justify-center text-sm text-muted-foreground">{footer}</CardFooter>
        </Card>
      </div>
    </main>
  );
}
