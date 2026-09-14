import Link from "next/link";
import { ArrowRight, LayoutTemplate, MessagesSquare, Star, Zap } from "lucide-react";

const services = [
  {
    title: "Website Design",
    description: "Modern, mobile-friendly websites built to earn trust and capture leads.",
    cta: "Explore Website Design",
    href: "/services/website-design",
    icon: LayoutTemplate,
  },
  {
    title: "Automation",
    description: "Missed-call text back, faster lead response, and automated follow-up.",
    cta: "Explore Automation",
    href: "/services/automation",
    icon: Zap,
  },
  {
    title: "Review Automation",
    description: "Make it easier to consistently ask happy customers for feedback and reviews.",
    cta: "Explore Reviews",
    href: "/services/review-automation",
    icon: Star,
  },
  {
    title: "Text Re-Marketing",
    description: "Stay in touch with past leads and customers with targeted follow-up campaigns.",
    cta: "Explore Re-Marketing",
    href: "/services/text-remarketing",
    icon: MessagesSquare,
  },
];

export function ServicesOverview() {
  return (
    <section
      aria-labelledby="services-overview-heading"
      className="bg-[#1b2951] py-20 text-white sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="flex items-center justify-center gap-3 text-[10px] font-bold tracking-[0.16em] text-[#a4ff4f] uppercase sm:text-xs">
            <span aria-hidden="true" className="h-0.5 w-7 bg-[#a4ff4f]" />
            THE CORE SERVICES
          </p>
          <h2
            id="services-overview-heading"
            className="mt-6 text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.15] font-extrabold tracking-[-0.045em] text-balance"
          >
            One System. Four Ways To Help Your Business Grow.
          </h2>
          <p className="mx-auto mt-6 max-w-[680px] text-base leading-[1.85] text-[#c3cbde] sm:text-[17px]">
            WebDashy combines the website, follow-up, reputation, and re-marketing
            tools local businesses need to turn more opportunities into customers.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-14 xl:grid-cols-4">
          {services.map(({ title, description, cta, href, icon: Icon }) => (
            <li
              key={href}
              className="group flex flex-col rounded-xl border border-white/15 bg-white/5 p-7 transition-colors duration-200 hover:border-[#a4ff4f]/50 hover:bg-white/10 focus-within:border-[#a4ff4f]/50 sm:p-8 xl:p-7"
            >
              <span className="flex size-14 items-center justify-center rounded-full border border-[#a4ff4f]/20 bg-[#a4ff4f]/10 text-[#a4ff4f]">
                <Icon size={26} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <h3 className="mt-8 text-xl leading-snug font-bold tracking-[-0.025em]">
                {title}
              </h3>
              <p className="mt-4 mb-8 text-[15px] leading-[1.8] text-[#c3cbde]">
                {description}
              </p>
              <Link
                href={href}
                className="mt-auto flex min-h-11 items-center justify-between gap-3 border-t border-white/15 pt-5 text-sm leading-relaxed font-semibold text-[#a4ff4f] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a4ff4f]"
              >
                {cta}
                <ArrowRight size={17} className="shrink-0 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 text-center">
          <p className="text-base leading-[1.85] text-[#c3cbde]">
            Each service works on its own. Together, they become the WebDashy System.
          </p>
          <Link
            href="/services"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#a4ff4f] px-7 py-4 text-sm font-bold text-[#1b2951] transition-colors hover:bg-[#94ef40] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a4ff4f]"
          >
            View All Services <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
