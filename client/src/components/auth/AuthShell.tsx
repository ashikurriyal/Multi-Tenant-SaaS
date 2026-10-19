import AuthTabs from "./AuthTabs";

type Props = {
  title: string;
  description: string;
  footer: React.ReactNode;
  // Log in and sign up show a switch between the two
  tabs?: boolean;
  children: React.ReactNode;
};

// The form column of the auth pages; the frame and brand panel come from (auth)/layout.tsx
export default function AuthShell({ title, description, footer, tabs, children }: Props) {
  return (
    // Anchored near the top, not vertically centered: the column grows when the session
    // check finishes (and the demo list loads), and a centered column would jump (CLS)
    <main className="mx-auto flex w-full max-w-100 flex-1 flex-col pt-10 sm:pt-[9vh]">
      <div className="auth-enter space-y-7">
        {tabs && <AuthTabs />}
        <div className="space-y-2">
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {children}
        <p className="text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </main>
  );
}
