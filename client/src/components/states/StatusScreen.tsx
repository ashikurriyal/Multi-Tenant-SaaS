import Link from "next/link";

type Props = {
  code?: string; // e.g. "404"
  title: string;
  message: string;
  action?: React.ReactNode;
};

// Full-page message for 404 and unexpected errors
export default function StatusScreen({ code, title, message, action }: Props) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-md space-y-4 text-center">
        {code && <p className="text-sm font-medium text-muted-foreground">{code}</p>}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {action}
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Go to the home page
          </Link>
        </div>
      </div>
    </main>
  );
}
