import Link from "next/link";
import { ArrowRight, MessagesSquare, PlugZap, Rocket, Handshake } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Discovery",
    description:
      "We learn about your business, services, customers, and what you want WebDashy to help improve.",
    icon: MessagesSquare,
  },
  {
    number: "02",
    title: "Build & Connect",
    description:
      "We build your website and configure the tools, workflows, and follow-up your business needs.",
    icon: PlugZap,
  },
  {
    number: "03",
    title: "Review & Launch",
    description:
      "We walk through everything with you, make final adjustments, and get your WebDashy system live.",
    icon: Rocket,
  },
  {
    number: "04",
    title: "Grow & Support",
    description:
      "Once you’re live, we stay available to help with updates, support, and improving how your system works over time.",
    icon: Handshake,
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="bg-[#f5f6f3] py-20 text-[#1b2951] sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="flex items-center justify-center gap-3 text-[10px] font-bold tracking-[0.16em] uppercase sm:text-xs">
            <span aria-hidden="true" className="h-0.5 w-7 bg-[#a4ff4f]" />
            SIMPLE FROM DAY ONE
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-6 text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.15] font-extrabold tracking-[-0.045em] text-balance"
          >
            From First Conversation To A System That Works For You.
          </h2>
          <p className="mx-auto mt-6 max-w-[680px] text-base leading-[1.85] text-[#606a7d] sm:text-[17px]">
            We keep the process simple. You tell us about your business, we build
            and connect the system, and then we help you get everything launched
            and working together.
          </p>
        </div>

        <ol className="mt-12 grid grid-cols-1 lg:mt-16 lg:grid-cols-4">
          {steps.map(({ number, title, description, icon: Icon }) => (
            <li
              key={number}
              className="relative pb-10 pl-20 last:pb-0 after:absolute after:top-14 after:bottom-0 after:left-7 after:w-px after:bg-[#1b2951]/20 last:after:hidden sm:pl-24 lg:pb-0 lg:pl-0 lg:after:top-7 lg:text-center lg:after:left-1/2 lg:after:h-px lg:after:w-full"
            >
              <span className="absolute top-0 left-0 flex size-14 items-center justify-center rounded-full border border-[#1b2951]/10 bg-[#a4ff4f] text-xl font-extrabold tracking-[-0.04em] lg:relative lg:z-10 lg:mx-auto">
                <span className="sr-only">Step </span>
                {number}
              </span>
              <div className="pt-1 lg:px-4 lg:pt-8">
                <Icon size={24} strokeWidth={1.6} aria-hidden="true" className="mb-4 text-[#52633e] lg:mx-auto" />
                <h3 className="text-xl leading-snug font-bold tracking-[-0.025em]">
                  {title}
                </h3>
                <p className="mx-auto mt-4 max-w-md text-[15px] leading-[1.8] text-[#606a7d]">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-14 flex flex-col items-start gap-7 rounded-2xl border border-[#1b2951]/10 bg-white p-7 sm:p-9 lg:mt-16 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:p-10">
          <div className="max-w-2xl">
            <h3 className="text-xl leading-snug font-bold tracking-[-0.025em] sm:text-2xl">
              You run your business. We handle the system behind it.
            </h3>
            <p className="mt-3 text-[15px] leading-[1.8] text-[#606a7d]">
              No complicated software setup. No piecing together five different
              tools on your own.
            </p>
          </div>
          <Link
            href="/how-it-works"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-full bg-[#a4ff4f] px-7 py-4 text-sm font-bold text-[#1b2951] transition-colors hover:bg-[#94ef40] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1b2951]"
          >
            See The Full Process <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
