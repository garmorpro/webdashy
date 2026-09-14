import { Globe, MessageCircle, Phone, Send, Smartphone, Star } from "lucide-react";
import styles from "./webdashy-system.module.css";

const services = [
  { title: "Website + Chat Widget", description: "Capture leads around the clock.", icon: Globe, companion: MessageCircle },
  { title: "5-Star Review Automation", description: "Turn happy customers into a stronger reputation.", icon: Star },
  { title: "Auto Call Text Back", description: "Respond instantly when you miss a call.", icon: Phone, companion: MessageCircle },
  { title: "Text Re-Marketing", description: "Stay in touch with past leads and customers.", icon: Send },
];

export function ServiceFlowDiagram() {
  return (
    <figure className={styles.diagram} aria-label="Four connected services feeding into Mobile CRM Access">
      <p className="sr-only">All four services below connect to the Mobile CRM Access, where you manage leads, conversations, contacts, and follow-up.</p>
      <div className={styles.flow}>
        <ul className={styles.services}>
          {services.map(({ title, description, icon: Icon, companion: Companion }) => (
            <li key={title} className={styles.service}>
              <span className={styles.icon}>
                <Icon size={27} strokeWidth={1.65} aria-hidden="true" />
                {Companion && <Companion className={styles.companion} size={19} strokeWidth={1.8} aria-hidden="true" />}
              </span>
              <h3 className="mt-5 text-lg leading-snug font-bold tracking-[-0.025em]">{title}</h3>
              <p className="mt-3 text-sm leading-[1.8] text-[#606a7d]">{description}</p>
            </li>
          ))}
        </ul>
        <svg className={styles.connections} viewBox="0 0 1000 160" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false">
          {[125, 375, 625, 875].map((x) => (
            <g key={x}>
              <path d={`M ${x} 0 V 25 C ${x} 100, 500 65, 500 140`} stroke="#7c9ac8" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <circle cx={x} cy="3" r="4" fill="#a4ff4f" stroke="#1b2951" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </g>
          ))}
          <path d="M 500 140 V 156 M 493 149 L 500 156 L 507 149" stroke="#426da9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className={styles.mobileConnection} aria-hidden="true" />
        <div className={styles.app}>
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#a4ff4f] text-[#1b2951] shadow-[0_4px_16px_-8px_rgba(27,41,81,0.3)]">
            <Smartphone size={34} strokeWidth={1.6} aria-hidden="true" />
          </span>
          <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.035em] sm:text-3xl">Mobile CRM Access</h3>
          <p className="mx-auto mt-3 max-w-72 text-[15px] leading-[1.8] text-[#606a7d]">Leads. Conversations. Contacts. Follow-Up. All in one place.</p>
        </div>
      </div>
      <figcaption className="relative mx-auto mt-10 max-w-xl text-center sm:mt-12">
        <p className="text-xl font-bold tracking-[-0.025em] sm:text-2xl">One system. Fewer missed opportunities.</p>
        <p className="mt-4 text-sm leading-[1.85] text-[#606a7d] sm:text-[15px]">Your website and automation tools work together behind the scenes while you manage customer conversations from your phone.</p>
      </figcaption>
    </figure>
  );
}

export function WebDashySystem() {
  return (
    <section aria-labelledby="webdashy-system-heading" className="border-t border-[#1b2951]/10 bg-white py-20 text-[#1b2951] sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="flex items-center justify-center gap-3 text-[10px] font-bold tracking-[0.16em] uppercase sm:text-xs"><span aria-hidden="true" className="h-0.5 w-7 bg-[#a4ff4f]" />ONE CONNECTED SYSTEM</p>
          <h2 id="webdashy-system-heading" className="mt-6 text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.15] font-extrabold tracking-[-0.045em] text-balance">Everything Your Business Needs To Capture, Follow Up, And Grow.</h2>
          <p className="mx-auto mt-6 max-w-[740px] text-base leading-[1.85] text-[#606a7d] sm:text-[17px]">WebDashy brings your website, customer conversations, follow-up, reviews, and re-marketing together into one simple system — so you can spend less time chasing leads and more time running your business.</p>
        </div>
        <ServiceFlowDiagram />
      </div>
    </section>
  );
}
