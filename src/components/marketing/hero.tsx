import { ArrowRight } from "lucide-react";
import { DemoLink } from "./demo-link";
import { HeroVisual } from "./hero-visual";

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="mx-auto grid max-w-7xl items-center gap-14 px-6 pt-14 pb-20 sm:pt-20 lg:min-h-[calc(100svh-6rem)] lg:grid-cols-[1.08fr_1fr] lg:gap-12 lg:px-10 lg:py-20">
      <div>
        <p className="mb-7 flex items-center gap-2.5 text-[10px] font-bold tracking-[0.16em] uppercase sm:text-xs"><span className="size-2 rounded-full bg-[#a4ff4f]" /> Built for local business. Designed for growth.</p>
        <h1 id="hero-heading" className="max-w-[620px] text-[clamp(2.35rem,5.1vw,4.35rem)] leading-[1.09] font-extrabold tracking-[-0.055em]">Turn Clicks Into Customers.<br /><span className="relative isolate inline-block whitespace-nowrap before:absolute before:inset-x-0 before:bottom-0.5 before:-z-10 before:h-[0.24em] before:bg-[#a4ff4f]">Automatically.</span></h1>
        <p className="mt-7 max-w-[510px] text-base leading-[1.85] text-[#606a7d] sm:text-[17px]">WebDashy gives your business a high-converting website and the automation tools to capture leads, respond faster, build your reputation, and bring customers back.</p>
        <div className="mt-9 flex flex-wrap items-center gap-4"><DemoLink /><a href="/services" className="inline-flex items-center justify-center gap-3 rounded-full border border-[#1b2951]/20 px-6 py-4 text-sm font-semibold transition-colors hover:bg-[#f3f6ef] focus-visible:outline-2 focus-visible:outline-offset-4">Explore Services <ArrowRight size={16} aria-hidden="true" /></a></div>
        <p className="mt-8 max-w-[460px] text-xs leading-6 text-[#687084]">Website. Follow-Up. Reviews. Re-Marketing.<br /><span className="font-semibold text-[#1b2951]">One Simple System.</span></p>
      </div>
      <HeroVisual />
    </section>
  );
}
