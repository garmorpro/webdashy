import { ArrowRight, CalendarDays, ContactRound, ListChecks, MessagesSquare, Smartphone, Sparkles, Star, UsersRound } from "lucide-react";
import styles from "./mobile-crm.module.css";

const benefits = [
  { title: "Manage New Leads", description: "See new inquiries and customer details in one organized place.", icon: UsersRound },
  { title: "Reply From Your Phone", description: "Keep customer conversations moving while you’re on the go.", icon: MessagesSquare },
  { title: "Track Follow-Up", description: "See what needs attention and keep leads from slipping through the cracks.", icon: ListChecks },
];

const capabilities = [
  { label: "Leads", icon: UsersRound },
  { label: "Conversations", icon: MessagesSquare },
  { label: "Contacts", icon: ContactRound },
  { label: "Appointments", icon: CalendarDays },
  { label: "Reviews", icon: Star },
  { label: "Follow-Up", icon: ListChecks },
];

function MobileCrmAccessVisual() {
  return (
    <figure className={styles.preview}>
      <div className={styles.stage}>
        <div className={styles.orbit} aria-hidden="true" />
        <div className={styles.phone} aria-hidden="true">
          <span className={styles.speaker} />
          <span className={styles.accessIcon}><MessagesSquare size={40} strokeWidth={1.5} /></span>
          <span className={styles.accessLabel}>Mobile<br />CRM Access</span>
        </div>
        <ul className={styles.capabilities} aria-label="Mobile CRM capabilities">
          {capabilities.map(({ label, icon: Icon }) => (
            <li className={styles.capability} key={label}>
              <Icon size={22} strokeWidth={1.65} aria-hidden="true" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className={styles.caption}><Smartphone size={16} aria-hidden="true" />Mobile access to your customer connections.</figcaption>
    </figure>
  );
}

export function MobileCrm() {
  return (
    <section aria-labelledby="mobile-crm-heading" className="bg-[#f5f6f3] py-14 text-[#1b2951] sm:py-16 lg:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:px-10">
        <MobileCrmAccessVisual />
        <div className="min-w-0">
          <p className="flex items-center gap-3 text-[10px] font-bold tracking-[0.16em] uppercase sm:text-xs"><span aria-hidden="true" className="h-0.5 w-7 bg-[#a4ff4f]" />YOUR BUSINESS ON THE GO</p>
          <h2 id="mobile-crm-heading" className="mt-6 text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.15] font-extrabold tracking-[-0.045em] text-balance">Stay Connected To Leads And Customers From Your Phone.</h2>
          <p className="mt-6 text-base leading-[1.85] text-[#606a7d]">Your WebDashy system includes mobile CRM access so you can keep up with customer conversations, contacts, appointments, and follow-up while you’re away from your desk.</p>
          <ul className="mt-6 space-y-4">
            {benefits.map(({ title, description, icon: Icon }) => (
              <li className="flex gap-4" key={title}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#1b2951]/10 bg-white"><Icon size={20} strokeWidth={1.65} aria-hidden="true" /></span>
                <div><h3 className="text-base font-bold tracking-[-0.02em]">{title}</h3><p className="mt-1 text-sm leading-[1.8] text-[#606a7d]">{description}</p></div>
              </li>
            ))}
          </ul>
          <p className="mt-6 flex gap-3 border-t border-[#1b2951]/10 pt-4 text-sm leading-[1.8] text-[#606a7d]"><Sparkles className="mt-1 shrink-0 text-[#42602d]" size={18} aria-hidden="true" />Your website and automations work behind the scenes while mobile access helps you stay connected.</p>
          <a href="/how-it-works" className="mt-6 inline-flex items-center justify-center gap-3 rounded-full bg-[#a4ff4f] px-6 py-4 text-sm font-bold transition-colors hover:bg-[#94ef40] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1b2951]">See How The System Works <ArrowRight size={17} aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  );
}
