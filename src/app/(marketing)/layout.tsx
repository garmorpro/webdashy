import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1b2951]">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <footer className="border-t border-[#1b2951]/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-8 text-sm lg:px-10">
          <Link href="/" aria-label="WebDashy home">
            <Image src="/brand/wordmark.png" alt="WebDashy" width={616} height={114} className="h-auto w-32" />
          </Link>
          <p>© {new Date().getFullYear()} WebDashy</p>
          <nav aria-label="Legal" className="flex gap-6">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
