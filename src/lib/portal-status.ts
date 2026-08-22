import type { PortalStatus } from "@prisma/client";

// Mirrors product-build.md §20 "Portal Management" statuses.
export const PORTAL_STATUS_LABELS: Record<PortalStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  VIEWED: "Viewed",
  SELECTED: "Selected",
  DISABLED: "Disabled",
};

export const PORTAL_STATUS_STYLES: Record<PortalStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-blue-50 text-blue-700",
  VIEWED: "bg-indigo-50 text-indigo-700",
  SELECTED: "bg-emerald-50 text-emerald-700",
  DISABLED: "bg-rose-50 text-rose-700",
};
