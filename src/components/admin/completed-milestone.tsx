"use client";

import { CheckCircle2, ChevronDown } from "lucide-react";

export function CompletedMilestone({ title, summary, children }: { title: string; summary: string; children: React.ReactNode }) {
  return <details className="group rounded-xl border border-border bg-card">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
      <span className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50"><CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true"/></span><span className="min-w-0"><span className="block text-sm font-semibold">{title}</span><span className="block truncate text-xs text-muted-foreground">{summary}</span></span></span>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true"/>
    </summary>
    <div className="border-t border-border p-3">{children}</div>
  </details>;
}
