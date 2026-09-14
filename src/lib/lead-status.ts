import type { LeadStatus } from "@prisma/client";

export const LEAD_STATUSES: LeadStatus[] = [
  "NEW", "CONTACTED", "INTERESTED", "FOLLOW_UP", "WON", "LOST",
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  FOLLOW_UP: "Follow up",
  WON: "Won",
  LOST: "Lost",
};

export const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  INTERESTED: "bg-violet-100 text-violet-700",
  FOLLOW_UP: "bg-amber-100 text-amber-700",
  WON: "bg-emerald-100 text-emerald-700",
  LOST: "bg-rose-100 text-rose-700",
};

export function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUSES.some((status) => status === value);
}
