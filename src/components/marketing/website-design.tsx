import {
  ArrowRight, Check, ChevronRight, Droplets, House, LockKeyhole,
  Menu, MessageCircle, MousePointer2, Phone, PlugZap, ShieldCheck,
  Smartphone, Wind, Wrench,
} from "lucide-react";
import styles from "./website-design.module.css";

const benefits = [
  { title: "Mobile-Friendly Design", description: "Looks professional and works smoothly on phones, tablets, and desktops.", icon: Smartphone },
  { title: "Built To Convert", description: "Clear calls-to-action help visitors take the next step instead of leaving.", icon: MousePointer2 },
  { title: "Connected To Automation", description: "Your website works with follow-up, reviews, and re-marketing instead of sitting alone.", icon: PlugZap },
];

function WebsitePreview() {
  return (
    <figure className={styles.preview}>
      {/* This is a decorative concept, with no pretend interactive controls. */}
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.browser}>
          <div className={styles.chrome}>
            <span className={styles.dots}><i /><i /><i /></span>
            <span className={styles.address}><LockKeyhole size={10} /> Your business. Your website.</span>
            <span className={styles.chromeMenu}>···</span>
          </div>
          <div className={styles.siteNav}>
            <span className={styles.wordmark}>YOUR LOCAL<span>HOME SERVICES</span></span>
            <span className={styles.navLinks}>Services <span>Our approach</span></span>
            <span className={styles.navCta}>Let’s talk <ArrowRight size={11} /></span>
          </div>
          <div className={styles.siteHero}>
            <p className={styles.siteEyebrow}>GOOD PEOPLE. GREAT SERVICE.</p>
            <p className={styles.siteHeading}>A home that works.<br /><span>A team that cares.</span></p>
            <p className={styles.siteCopy}>From everyday repairs to unexpected fixes,<br />make yourself comfortable. We’ll handle the rest.</p>
            <span className={styles.mockButton}>Request a service <ArrowRight size={13} /></span>
            <div className={styles.trust}><ShieldCheck size={15} /> Local expertise. Personal service.</div>
            <div className={styles.houseArt}><House strokeWidth={0.8} /><span><Check size={19} /></span></div>
          </div>
          <div className={styles.services}>
            <p>One trusted team. All around your home.</p>
            <div className={styles.serviceGrid}>
              {[{ icon: Droplets, label: "Plumbing" }, { icon: Wind, label: "Heating & air" }, { icon: Wrench, label: "Home repairs" }].map(({ icon: Icon, label }) => (
                <div key={label}><Icon size={20} strokeWidth={1.5} /><span>{label}</span><ChevronRight size={12} /></div>
              ))}
            </div>
          </div>
          <div className={styles.siteBottom}><span><ShieldCheck size={14} /> Care for your home, from the first hello.</span></div>
          <span className={styles.chat}><MessageCircle size={19} /> How can we help?</span>
        </div>
        <div className={styles.phone}>
          <div className={styles.speaker} />
          <div className={styles.phoneNav}><span>YOUR LOCAL</span><Menu size={13} /></div>
          <div className={styles.phoneHero}>
            <House size={32} strokeWidth={1.25} />
            <p>A home that works.<br /><span>A team that cares.</span></p>
            <span className={styles.phoneCopy}>Expert help for your home.<br />Just a tap away.</span>
            <span className={styles.phoneButton}>Request a service <ArrowRight size={10} /></span>
          </div>
          <div className={styles.phoneTrust}><ShieldCheck size={12} /> Local expertise</div>
          <div className={styles.phoneContact}><Phone size={12} /> Call our team <MessageCircle size={16} /></div>
          <div className={styles.homeIndicator} />
        </div>
      </div>
      <figcaption className={styles.caption}>
        <span><Smartphone size={16} aria-hidden="true" /> Built for every screen.</span>
        <span>Illustrative website concept</span>
        <span className="sr-only">A local home services website with clear navigation, a service request call to action, trust content, service cards, and chat, shown on desktop and mobile.</span>
      </figcaption>
    </figure>
  );
}

export function WebsiteDesign() {
  return (
    <section aria-labelledby="website-design-heading" className="border-t border-[#1b2951]/10 bg-[#f5f6f3] py-14 text-[#1b2951] sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="flex items-center justify-center gap-3 text-[10px] font-bold tracking-[0.16em] uppercase sm:text-xs"><span aria-hidden="true" className="h-0.5 w-7 bg-[#a4ff4f]" />YOUR DIGITAL FRONT DOOR</p>
          <h2 id="website-design-heading" className="mt-6 text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.15] font-extrabold tracking-[-0.045em] text-balance">A Better Website Is Where Better Follow-Up Starts.</h2>
          <p className="mt-6 text-base leading-[1.85] text-[#606a7d] sm:text-[17px]">Your website should do more than look good. WebDashy builds modern, mobile-friendly websites designed to earn trust, guide visitors toward action, and connect directly into your follow-up system.</p>
        </div>
        <div className="mt-8 grid items-center gap-8 lg:mt-10 lg:grid-cols-[1.12fr_1fr] lg:gap-14">
          <WebsitePreview />
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-bold text-[#42602d]"><Check size={16} aria-hidden="true" /> A professionally built website. Included in every plan.</p>
            <ul className="divide-y divide-[#1b2951]/10">
              {benefits.map(({ title, description, icon: Icon }) => (
                <li key={title} className="flex gap-4 py-4">
                  <Icon className="mt-0.5 shrink-0 text-[#426da9]" size={22} strokeWidth={1.65} aria-hidden="true" />
                  <div><h3 className="text-base font-bold tracking-[-0.02em] sm:text-lg">{title}</h3><p className="mt-1.5 text-sm leading-[1.8] text-[#606a7d]">{description}</p></div>
                </li>
              ))}
            </ul>
            <a href="/services/website-design" className="mt-6 inline-flex items-center justify-center gap-3 rounded-full bg-[#a4ff4f] px-6 py-4 text-sm font-bold transition-colors hover:bg-[#94ef40] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1b2951]">Explore Website Design <ArrowRight size={17} aria-hidden="true" /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
