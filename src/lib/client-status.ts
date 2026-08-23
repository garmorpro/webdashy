import type { ClientStatus } from "@prisma/client";

// Mirrors product-build.md §6 "Client statuses", extended with the 8-step
// pipeline (ARCHITECTURE.md §4 "Client pipeline"): INVOICE_SENT and
// DELIVERED were added alongside Plans/Invoicing/Delivery.
export const CLIENT_STATUSES: ClientStatus[] = [
  "LEAD",
  "CONTACTED",
  "INTERESTED",
  "PORTAL_SENT",
  "VIEWED",
  "TEMPLATE_SELECTED",
  "INVOICE_SENT",
  "BUILDING",
  "DELIVERED",
  "WON",
  "LOST",
];

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  LEAD: "Lead",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  PORTAL_SENT: "Portal Sent",
  VIEWED: "Viewed",
  TEMPLATE_SELECTED: "Template Selected",
  INVOICE_SENT: "Invoice Sent",
  BUILDING: "Building",
  DELIVERED: "Delivered",
  WON: "Won",
  LOST: "Lost",
};

export const CLIENT_STATUS_STYLES: Record<ClientStatus, string> = {
  LEAD: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-slate-100 text-slate-700",
  INTERESTED: "bg-blue-50 text-blue-700",
  PORTAL_SENT: "bg-blue-50 text-blue-700",
  VIEWED: "bg-indigo-50 text-indigo-700",
  TEMPLATE_SELECTED: "bg-amber-50 text-amber-700",
  INVOICE_SENT: "bg-blue-50 text-blue-700",
  BUILDING: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-indigo-50 text-indigo-700",
  WON: "bg-emerald-50 text-emerald-700",
  LOST: "bg-rose-50 text-rose-700",
};

// The 8-step pipeline shown as a stepper on the client detail page — a
// simplified, fixed sequence distinct from the full ClientStatus enum
// above (e.g. LEAD/CONTACTED/INTERESTED collapse into one "Add Lead /
// Contact" pair of steps). Maps a ClientStatus to how far along the
// stepper that status implies.
export const PIPELINE_STEPS = [
  "Add Lead",
  "Contact",
  "Portal Sent",
  "Template & Plan",
  "Invoice",
  "Building",
  "Delivered",
  "Complete",
] as const;

export function pipelineStepIndex(status: ClientStatus): number {
  switch (status) {
    case "LEAD":
      return 0;
    case "CONTACTED":
    case "INTERESTED":
      return 1;
    case "PORTAL_SENT":
    case "VIEWED":
      return 2;
    case "TEMPLATE_SELECTED":
      return 3;
    case "INVOICE_SENT":
      return 4;
    case "BUILDING":
      return 5;
    case "DELIVERED":
      return 6;
    case "WON":
      return 7;
    case "LOST":
      return 0;
  }
}
