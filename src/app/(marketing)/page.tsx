import type { Metadata } from "next";
import { CustomerProblems } from "@/components/marketing/customer-problems";
import { ServicesOverview } from "@/components/marketing/services-overview";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Hero } from "@/components/marketing/hero";
import { WebDashySystem } from "@/components/marketing/webdashy-system";

export const metadata: Metadata = {
  title: "WebDashy | Turn Clicks Into Customers. Automatically.",
  description:
    "WebDashy gives your business a high-converting website and the automation tools to capture leads, respond faster, build your reputation, and bring customers back.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <CustomerProblems />
      <WebDashySystem />
      <ServicesOverview />
      <HowItWorks />
    </>
  );
}
