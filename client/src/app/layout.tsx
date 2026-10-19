import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import AuthBootstrap from "@/components/AuthBootstrap";
import { Toaster } from "@/components/ui/sonner";
import StoreProvider from "@/redux/StoreProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LedgerFlow",
  description: "Multi-tenant SaaS billing and usage analytics",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The landing page scrolls smoothly to its sections; this tells Next.js to switch that
    // off while it navigates between pages, so route changes jump to the top instantly
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Browser extensions (e.g. ColorZilla's cz-shortcut-listen) add attributes to <body>
          before React loads. This ignores attribute differences on <body> itself only;
          mismatches inside the page are still reported. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Redux creates a random id when the store starts; with Cache Components that must
            happen per request, so the store-backed tree streams inside this boundary */}
        <Suspense fallback={null}>
          <StoreProvider>
            <AuthBootstrap />
            {children}
            <Toaster richColors position="top-right" />
          </StoreProvider>
        </Suspense>
      </body>
    </html>
  );
}
