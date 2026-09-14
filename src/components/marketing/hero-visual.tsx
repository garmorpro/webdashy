import { ArrowUpRight, Check, CheckCheck, Globe2, MessageSquare, MousePointer2, ShieldCheck, Star, Zap } from "lucide-react";

export function HeroVisual() {
  return (
    <figure id="how-it-works" tabIndex={-1} aria-label="Illustrative preview: a website captures an enquiry, an automatic reply follows up, and customer reviews build trust." className="relative mx-auto w-full max-w-[560px] scroll-mt-8 rounded-[2rem] bg-[#f3f6ef] px-5 pb-7 pt-9 focus-visible:outline-2 focus-visible:outline-offset-4 sm:px-9 sm:pt-12 lg:mt-3">
      <div aria-hidden="true">
        <div className="mb-7 flex items-center justify-between gap-2 text-[10px] font-semibold tracking-[0.13em] text-[#596650] sm:text-[11px]">
          <span>YOUR BUSINESS. ALWAYS ON.</span><span className="flex items-center gap-1.5 tracking-normal"><span className="size-1.5 rounded-full bg-[#518827]" /> Working for you</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#1b2951]/10 bg-white shadow-[0_18px_45px_-20px_rgba(27,41,81,0.3)]">
          <div className="flex h-10 items-center gap-1.5 border-b border-[#1b2951]/8 px-4">
            <span className="size-1.5 rounded-full bg-[#dce1dc]" /><span className="size-1.5 rounded-full bg-[#dce1dc]" /><span className="size-1.5 rounded-full bg-[#dce1dc]" />
            <span className="mx-auto flex items-center gap-1.5 rounded bg-[#f5f6f7] px-7 py-1 text-[9px] text-[#6c7383]"><Globe2 size={10} /> yourbusiness.com</span>
          </div>
          <div className="p-5 sm:p-7">
            <div className="mb-7 flex items-center justify-between text-[9px] font-bold"><span className="flex items-center gap-1.5"><span className="size-4 rounded-full bg-[#1b2951]" /> YOUR BUSINESS</span><span className="text-[#748071]">Local expertise. Personal service.</span></div>
            <div className="grid grid-cols-[1fr_0.7fr] gap-3">
              <div><p className="text-[23px] leading-[1.17] font-bold tracking-tight sm:text-[29px]">Great service.<br />Right here.<br />Ready for you.</p><p className="mt-3 text-[10px] leading-relaxed text-[#6c7383]">Your local team. A simpler way<br />to get things taken care of.</p><div className="relative mt-4 inline-flex items-center gap-3 rounded-md bg-[#a4ff4f] px-3 py-2 text-[9px] font-bold">Get a free quote <ArrowUpRight size={12} /><MousePointer2 className="absolute -right-3 -bottom-4 fill-[#1b2951] text-white" size={27} /></div></div>
              <div className="relative flex items-center justify-center overflow-hidden rounded-[45%_45%_12px_12px] bg-[#edf2e7]"><div className="absolute size-36 rounded-full border border-[#d8e3cd]" /><div className="absolute size-24 rounded-full border border-[#d8e3cd]" /><div className="relative flex size-16 rotate-[-8deg] items-center justify-center rounded-2xl bg-[#1b2951] shadow-xl"><ShieldCheck size={33} className="text-[#a4ff4f]" /></div></div>
            </div>
            <div className="mt-7 flex items-center gap-1 border-t border-[#1b2951]/8 pt-3"><span className="flex text-[#527b2d]">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={10} fill="currentColor" />)}</span><span className="ml-2 text-[9px] text-[#6c7383]">Service your neighbors can count on.</span></div>
          </div>
        </div>
        <div className="relative -mt-4 ml-5 flex items-center gap-3 rounded-xl border border-[#1b2951]/8 bg-white p-4 shadow-[0_12px_30px_-15px_rgba(27,41,81,0.25)] sm:ml-12">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#a4ff4f]"><Zap size={18} /></div><div className="min-w-0"><p className="text-xs font-bold">New lead. Already followed up.</p><p className="mt-1 text-[10px] text-[#687084]">Website enquiry → automatic reply</p></div><Check size={16} className="ml-auto shrink-0 text-[#518827]" />
        </div>
        <div className="relative mx-2 mt-4 rounded-xl bg-[#1b2951] p-4 text-white sm:mr-10 sm:ml-0">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-medium"><MessageSquare size={13} className="text-[#a4ff4f]" /> A quick reply. A great first impression.</div><p className="rounded-lg rounded-bl-none bg-white/10 px-3 py-2.5 text-[11px] leading-relaxed text-white/90">Thanks for reaching out! We’ve received your request and will be in touch shortly.</p><p className="mt-2 flex items-center justify-end gap-1 text-[9px] text-[#c5dfa9]">Sent automatically <CheckCheck size={12} /></p>
        </div>
      </div>
      <figcaption className="mt-5 text-center text-[10px] tracking-wide text-[#687084]">A glimpse of your website + automation working together.</figcaption>
    </figure>
  );
}
