import {
  ArrowRight,
  Clock3,
  Monitor,
  PhoneMissed,
  Star,
  UserRoundMinus,
} from "lucide-react";

const problems = [
  {
    title: "Outdated Website",
    description:
      "Your website looks dated, loads poorly on mobile, or makes it difficult for customers to take the next step.",
    icon: Monitor,
  },
  {
    title: "Missed Calls",
    description:
      "When you’re busy working, unanswered calls can turn into lost jobs before you ever get the chance to call back.",
    icon: PhoneMissed,
  },
  {
    title: "Slow Follow-Up",
    description:
      "The longer a lead waits for a response, the easier it is for them to move on to another business.",
    icon: Clock3,
  },
  {
    title: "Not Enough Reviews",
    description:
      "Happy customers may love your work, but without a consistent review process, your reputation may not reflect it.",
    icon: Star,
  },
  {
    title: "Past Customers Go Cold",
    description:
      "Customers and old leads often disappear simply because nobody follows up with them again.",
    icon: UserRoundMinus,
  },
];

export function CustomerProblems() {
  return (
    <section
      aria-labelledby="customer-problems-heading"
      className="border-t border-[#1b2951]/10 bg-[#f5f6f3] py-20 text-[#1b2951] sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="flex items-center justify-center gap-3 text-[10px] font-bold tracking-[0.16em] uppercase sm:text-xs">
            <span aria-hidden="true" className="h-0.5 w-7 bg-[#a4ff4f]" />
            Where Leads Slip Through
          </p>
          <h2
            id="customer-problems-heading"
            className="mt-6 text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.15] font-extrabold tracking-[-0.045em] text-balance"
          >
            Your Business Could Be Losing Customers Before You Ever Speak To Them.
          </h2>
          <p className="mx-auto mt-6 max-w-[680px] text-base leading-[1.85] text-[#606a7d] sm:text-[17px]">
            Most local businesses don’t have a lead problem — they have a
            follow-up problem. A weak website, missed calls, slow responses, and
            inconsistent customer follow-up can quietly cost you opportunities
            every week.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-6 lg:gap-6">
          {problems.map(({ title, description, icon: Icon }, index) => (
            <li
              key={title}
              className={`rounded-2xl border border-[#1b2951]/10 bg-white p-7 shadow-[0_6px_24px_-16px_rgba(27,41,81,0.18)] sm:p-8 lg:col-span-2 ${
                index === problems.length - 1
                  ? "sm:col-span-2 sm:mx-auto sm:w-[calc(50%-0.625rem)] lg:mx-0 lg:w-auto"
                  : index === 3
                    ? "lg:col-start-2"
                    : ""
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="flex size-12 items-center justify-center rounded-xl border border-[#1b2951]/5 bg-[#f0f5e9]">
                  <Icon size={23} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span aria-hidden="true" className="text-xs font-semibold tracking-widest text-[#697387]">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-6 text-xl leading-snug font-bold tracking-[-0.025em]">
                {title}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.8] text-[#606a7d]">
                {description}
              </p>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-10 flex max-w-4xl flex-col items-center gap-4 rounded-2xl bg-[#1b2951] px-6 py-6 text-center sm:flex-row sm:gap-5 sm:px-8 sm:text-left lg:mt-12">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#a4ff4f] text-[#1b2951]">
            <ArrowRight size={18} aria-hidden="true" />
          </span>
          <p className="text-sm leading-[1.85] text-white sm:text-[15px]">
            WebDashy connects your website, conversations, follow-up, reviews, and
            re-marketing so fewer opportunities fall through the cracks.
          </p>
        </div>
      </div>
    </section>
  );
}
