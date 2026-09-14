"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useRef, useState } from "react";
import { DemoLink } from "./demo-link";

const services = [
  ["All Services", "/services"],
  ["Website Design", "/services/website-design"],
  ["Automation", "/services/automation"],
  ["Review Automation", "/services/review-automation"],
  ["Text Re-Marketing", "/services/text-remarketing"],
];
const pages = [
  ["How It Works", "/how-it-works"],
  ["Pricing", "/pricing"],
  ["Industries", "/industries"],
  ["About", "/about"],
  ["Contact", "/contact"],
];
const linkClass = "rounded-sm transition-colors hover:text-[#437420] focus-visible:outline-2 focus-visible:outline-offset-4";

function ServicesDropdown() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }} onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
        toggle.current?.focus();
      }
    }}>
      <div className="flex items-center gap-1">
        <Link href="/services" onClick={() => setOpen(false)} className={linkClass}>Services</Link>
        <button ref={toggle} type="button" aria-label="Services submenu" aria-expanded={open} aria-controls="services-navigation" onClick={() => setOpen(!open)} className="flex size-8 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2">
          <ChevronDown size={16} aria-hidden="true" className={open ? "rotate-180" : ""} />
        </button>
      </div>
      <ul id="services-navigation" hidden={!open} className="absolute left-0 top-full w-56 space-y-1 rounded-lg border border-[#1b2951]/10 bg-white p-2 shadow-lg">
        {services.map(([label, href]) => <li key={href}><Link href={href} onClick={() => setOpen(false)} className={`${linkClass} block px-3 py-3`}>{label}</Link></li>)}
      </ul>
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  return (
    <header className="relative z-10 border-b border-[#1b2951]/8 bg-white">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded-lg focus:bg-[#a4ff4f] focus:p-3">Skip to content</a>
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-5 px-6 lg:px-10">
        <Link href="/" onClick={() => setOpen(false)} aria-label="WebDashy home" className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4">
          <Image src="/brand/wordmark.png" alt="WebDashy" width={616} height={114} preload className="h-auto w-40 sm:w-44" />
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-5 text-sm font-medium xl:flex">
          <Link href="/" className={linkClass}>Home</Link>
          <ServicesDropdown />
          {pages.map(([label, href]) => <Link key={href} href={href} className={linkClass}>{label}</Link>)}
          <DemoLink compact />
        </nav>
        <button ref={toggle} type="button" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen(!open)} className="flex size-11 items-center justify-center rounded-full border border-[#1b2951]/15 focus-visible:outline-2 focus-visible:outline-offset-4 xl:hidden">
          {open ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
      </div>
      <nav id="mobile-navigation" aria-label="Mobile navigation" hidden={!open} onClick={(event) => {
        if ((event.target as HTMLElement).closest("a")) setOpen(false);
      }} onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== toggle.current) setOpen(false);
      }} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } }} className="absolute inset-x-0 top-full max-h-[calc(100dvh-6rem)] overflow-y-auto border-b border-[#1b2951]/10 bg-white px-6 pb-6 shadow-lg xl:hidden">
        <ul className="space-y-4 pt-4 text-sm font-medium">
          <li><Link href="/" className={`${linkClass} block py-2`}>Home</Link></li>
          <li>
            <Link href="/services" className={`${linkClass} block py-2`}>Services</Link>
            <ul className="ml-3 space-y-1 border-l border-[#1b2951]/15 pl-4">
              {services.map(([label, href]) => <li key={href}><Link href={href} className={`${linkClass} block py-2`}>{label}</Link></li>)}
            </ul>
          </li>
          {pages.map(([label, href]) => <li key={href}><Link href={href} className={`${linkClass} block py-2`}>{label}</Link></li>)}
          <li><DemoLink compact /></li>
        </ul>
      </nav>
    </header>
  );
}
