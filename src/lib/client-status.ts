import type { ClientStatus } from "@prisma/client";

// Mirrors product-build.md §6 "Client statuses".
export const CLIENT_STATUSES: ClientStatus[] = [
  "LEAD",
  "CONTACTED",
  "INTERESTED",
  "PORTAL_SENT",
  "VIEWED",
  "TEMPLATE_SELECTED",
  "BUILDING",
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
  BUILDING: "Building",
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
  BUILDING: "bg-amber-50 text-amber-700",
  WON: "bg-emerald-50 text-emerald-700",
  LOST: "bg-rose-50 text-rose-700",
};
