import type { Metadata } from "next";
import { Automation } from "@/components/marketing/automation";
import { CustomerProblems } from "@/components/marketing/customer-problems";
import { MobileCrm } from "@/components/marketing/mobile-crm";
import { Hero } from "@/components/marketing/hero";
import { WebsiteDesign } from "@/components/marketing/website-design";
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
      <WebsiteDesign />
      <Automation />
      <MobileCrm />
    </>
  );
}
