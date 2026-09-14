import { ArrowUpRight } from "lucide-react";

const demoUrl = "/book-a-demo";

export function DemoLink({ compact = false }: { compact?: boolean }) {
  return (
    <a href={demoUrl} className={`inline-flex items-center justify-center gap-3 rounded-full bg-[#a4ff4f] font-bold text-[#1b2951] transition-colors hover:bg-[#91ed3d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1b2951] ${compact ? "px-5 py-3 text-sm" : "px-7 py-4 text-sm"}`}>
      Book a Demo <ArrowUpRight size={17} aria-hidden="true" />
    </a>
  );
}
