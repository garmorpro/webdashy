import {
  ArrowDown, ArrowRight, Check, Clock3, FolderCheck, MessageCircle,
  MessagesSquare, PhoneMissed, Send, SlidersHorizontal, Zap,
} from "lucide-react";
import styles from "./automation.module.css";

const benefits = [
  { title: "Auto Call Text Back", description: "Send a helpful text automatically when you miss a call.", icon: PhoneMissed },
  { title: "Faster Lead Response", description: "Give new inquiries a quick first response instead of making them wait.", icon: Zap },
  { title: "Automated Follow-Up", description: "Keep leads moving with scheduled messages and reminders.", icon: Clock3 },
  { title: "One Conversation History", description: "Calls, texts, and customer conversations stay organized in one place.", icon: MessagesSquare },
  { title: "Built Around Your Business", description: "Automation is configured around your services, workflow, and customer experience.", icon: SlidersHorizontal },
];

const steps = [
  { title: "Missed Call", detail: "A customer calls while you’re busy.", icon: PhoneMissed },
  { title: "Automatic Text Back", detail: "Sent automatically after the missed call", message: "Hi! Sorry we missed your call. How can we help?", icon: Send },
  { title: "Customer Replies", message: "I’m looking for an estimate.", icon: MessageCircle },
  { title: "Conversation Continues", detail: "New conversation ready for follow-up", icon: MessagesSquare },
  { title: "Lead stays organized in the CRM", detail: "One place for the conversation and your next step.", icon: FolderCheck },
];

function AutomationWorkflow() {
  return (
    <figure className={styles.workflow}>
      <figcaption className={styles.workflowHeader}>
        <span className={styles.workflowLabel}><Zap size={16} aria-hidden="true" /> From missed call to conversation</span>
        <span className={styles.example}>Example workflow</span>
      </figcaption>
      <ol className={styles.timeline}>
        {steps.map(({ title, detail, message, icon: Icon }, index) => (
          <li key={title} className={styles.step}>
            <span className={`${styles.node} ${index === 1 || index === 4 ? styles.highlight : ""}`}>
              <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <div className={styles.stepContent}>
              <div className={styles.stepHeading}>
                <h3>{title}</h3>
                {index === 1 && <span className={styles.auto}><Zap size={11} aria-hidden="true" /> Auto</span>}
              </div>
              {detail && <p className={styles.detail}>{detail}</p>}
              {message && <p className={`${styles.message} ${index === 2 ? styles.reply : ""}`}>{message}</p>}
              {index === 1 && <span className={styles.sent}><Check size={12} aria-hidden="true" /> Automatic first response</span>}
            </div>
            {index < steps.length - 1 && <ArrowDown className={styles.connector} size={14} aria-hidden="true" />}
          </li>
        ))}
      </ol>
      <p className={styles.workflowFooter}><Zap size={15} aria-hidden="true" /> A quick first response, even when you can’t pick up.</p>
    </figure>
  );
}

export function Automation() {
  return (
    <section aria-labelledby="automation-heading" className="bg-[#1b2951] py-20 text-white sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="flex items-center justify-center gap-3 text-[10px] font-bold tracking-[0.16em] text-[#a4ff4f] uppercase sm:text-xs"><span aria-hidden="true" className="h-0.5 w-7 bg-[#a4ff4f]" />SMARTER FOLLOW-UP</p>
          <h2 id="automation-heading" className="mt-6 text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.15] font-extrabold tracking-[-0.045em] text-balance">Respond Faster. Follow Up Automatically.</h2>
          <p className="mt-6 text-base leading-[1.85] text-[#c2cbdc] sm:text-[17px]">WebDashy helps your business respond when you can’t. Missed calls, website inquiries, and new leads can trigger fast, professional follow-up so fewer opportunities go cold.</p>
        </div>
        <div className="mt-12 grid items-center gap-12 lg:mt-16 lg:grid-cols-[1.12fr_1fr] lg:gap-14">
          <AutomationWorkflow />
          <div className="min-w-0">
            <p className="mb-3 text-sm font-semibold text-[#a4ff4f]">Follow up before the lead moves on.</p>
            <ul className="divide-y divide-white/10">
              {benefits.map(({ title, description, icon: Icon }) => (
                <li key={title} className="flex gap-4 py-5">
                  <Icon className="mt-0.5 shrink-0 text-[#a4ff4f]" size={22} strokeWidth={1.65} aria-hidden="true" />
                  <div><h3 className="text-base font-bold tracking-[-0.02em] sm:text-lg">{title}</h3><p className="mt-1.5 text-sm leading-[1.8] text-[#c2cbdc]">{description}</p></div>
                </li>
              ))}
            </ul>
            <a href="/services/automation" className="mt-6 inline-flex items-center justify-center gap-3 rounded-full bg-[#a4ff4f] px-6 py-4 text-sm font-bold text-[#1b2951] transition-colors hover:bg-[#94ef40] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a4ff4f]">Explore Automation <ArrowRight size={17} aria-hidden="true" /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
