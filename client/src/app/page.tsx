import type { Metadata } from "next";
import DemoCards from "@/components/landing/DemoCards";
import Developers from "@/components/landing/Developers";
import Faq from "@/components/landing/Faq";
import Features from "@/components/landing/Features";
import FinalCta from "@/components/landing/FinalCta";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import LandingEffects from "@/components/landing/LandingEffects";
import LandingFooter from "@/components/landing/LandingFooter";
import Navbar from "@/components/landing/Navbar";
import Platform from "@/components/landing/Platform";
import Pricing from "@/components/landing/Pricing";
import Proof from "@/components/landing/Proof";
import "@/components/landing/landing.css";

// Validated for instant navigation (see next.config.ts)
export const instant = true;

export const metadata: Metadata = {
  title: "LedgerFlow · Subscriptions, usage billing and revenue analytics",
  description:
    "Multi-tenant SaaS billing on Stripe: plans with proration, metered usage with hard limits, a grace period when payments fail, and MRR, churn and NRR analytics. Try the live demo.",
};

export default function Home() {
  return (
    <div className="lf motion">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Platform />
      <Developers />
      <Proof />
      <DemoCards />
      <Pricing />
      <Faq />
      <FinalCta />
      <LandingFooter />
      <LandingEffects />
    </div>
  );
}
