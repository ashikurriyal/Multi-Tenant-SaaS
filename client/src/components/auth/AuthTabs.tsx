"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/login", label: "Log in" },
  { href: "/register", label: "Sign up" },
];

// The switch between log in and sign up; the highlight slides to the current page
export default function AuthTabs() {
  const pathname = usePathname();
  const active = Math.max(
    0,
    TABS.findIndex((t) => pathname.startsWith(t.href)),
  );

  return (
    <nav
      aria-label="Account"
      className="relative grid grid-cols-2 rounded-xl border bg-muted/70 p-1 text-sm font-medium"
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-primary shadow-[0_6px_16px_-8px_var(--primary)] transition-transform duration-300 ease-[cubic-bezier(.3,1.2,.4,1)]"
        style={{ transform: `translateX(${active * 100}%)` }}
      />
      {TABS.map((t, i) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={i === active ? "page" : undefined}
          className={cn(
            "relative z-10 flex h-9 items-center justify-center rounded-lg transition-colors duration-300",
            i === active
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
