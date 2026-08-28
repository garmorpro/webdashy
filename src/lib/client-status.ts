import type { ClientStatus } from "@prisma/client";

// Mirrors product-build.md §6 "Client statuses", extended with the 8-step
// pipeline (ARCHITECTURE.md §4 "Client pipeline"): INVOICE_SENT and
// DELIVERED were added alongside Plans/Invoicing/Delivery, and
// QUESTIONNAIRE_SENT/QUESTIONNAIRE_DONE were added alongside the Design
// Questionnaire feature (sent once a lead confirms they want a site,
// filled in before a template portal exists).
export const CLIENT_STATUSES: ClientStatus[] = [
  "LEAD",
  "CONTACTED",
  "INTERESTED",
  "QUESTIONNAIRE_SENT",
  "QUESTIONNAIRE_DONE",
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
  QUESTIONNAIRE_SENT: "Questionnaire Sent",
  QUESTIONNAIRE_DONE: "Questionnaire Done",
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
  QUESTIONNAIRE_SENT: "bg-violet-50 text-violet-700",
  QUESTIONNAIRE_DONE: "bg-fuchsia-50 text-fuchsia-700",
  PORTAL_SENT: "bg-blue-50 text-blue-700",
  VIEWED: "bg-indigo-50 text-indigo-700",
  TEMPLATE_SELECTED: "bg-amber-50 text-amber-700",
  INVOICE_SENT: "bg-blue-50 text-blue-700",
  BUILDING: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-indigo-50 text-indigo-700",
  WON: "bg-emerald-50 text-emerald-700",
  LOST: "bg-rose-50 text-rose-700",
};

// The 10-step pipeline shown as a stepper on the client detail page — a
// simplified, fixed sequence distinct from the full ClientStatus enum
// above (e.g. LEAD/CONTACTED/INTERESTED collapse into one "Add Lead /
// Contact" pair of steps). Maps a ClientStatus to how far along the
// stepper that status implies.
export const PIPELINE_STEPS = [
  "Add Lead",
  "Contact",
  "Questionnaire Sent",
  "Questionnaire Done",
  "Portal Sent",
  "Template & Plan",
  "Invoice",
  "Building",
  "Delivered",
  "Complete",
] as const;

// One anchor id per PIPELINE_STEPS position — clicking a step on the
// stepper (ClientStepper) scrolls the client-detail page to the matching
// workflow card rather than changing anything. Several steps share a card
// (e.g. "Portal Sent" and "Template & Plan" are both the Template Portal
// card — the plan is picked as part of that same card's flow), and "Add
// Lead" has no card of its own, so it points at Contact.
const PIPELINE_STEP_ANCHORS = [
  "contact", // Add Lead
  "contact",
  "questionnaire", // Questionnaire Sent
  "questionnaire", // Questionnaire Done
  "portal", // Portal Sent
  "portal", // Template & Plan
  "invoice",
  "delivery", // Building
  "delivery", // Delivered
  "delivery", // Complete
] as const;

export function anchorForPipelineStep(index: number): string {
  return PIPELINE_STEP_ANCHORS[index] ?? "contact";
}

// Kanban board columns for the Clients page's "Board" view — same pipeline
// grouping as PIPELINE_STEPS/pipelineStepIndex above, but with LOST broken
// out into its own trailing column instead of collapsing into "Lead" (the
// stepper has no use for a distinct Lost step; the board does).
export type BoardColumnKey =
  | "LEAD"
  | "CONTACTED"
  | "QUESTIONNAIRE_SENT"
  | "QUESTIONNAIRE_DONE"
  | "PORTAL_SENT"
  | "TEMPLATE_SELECTED"
  | "INVOICE_SENT"
  | "BUILDING"
  | "DELIVERED"
  | "WON"
  | "LOST";

export const BOARD_COLUMNS: { key: BoardColumnKey; label: string }[] = [
  { key: "LEAD", label: "Lead" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "QUESTIONNAIRE_SENT", label: "Questionnaire Sent" },
  { key: "QUESTIONNAIRE_DONE", label: "Questionnaire Done" },
  { key: "PORTAL_SENT", label: "Portal Sent" },
  { key: "TEMPLATE_SELECTED", label: "Template & Plan" },
  { key: "INVOICE_SENT", label: "Invoice" },
  { key: "BUILDING", label: "Building" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
];

export function boardColumnKey(status: ClientStatus): BoardColumnKey {
  switch (status) {
    case "LEAD":
      return "LEAD";
    case "CONTACTED":
    case "INTERESTED":
      return "CONTACTED";
    case "QUESTIONNAIRE_SENT":
      return "QUESTIONNAIRE_SENT";
    case "QUESTIONNAIRE_DONE":
      return "QUESTIONNAIRE_DONE";
    case "PORTAL_SENT":
    case "VIEWED":
      return "PORTAL_SENT";
    case "TEMPLATE_SELECTED":
      return "TEMPLATE_SELECTED";
    case "INVOICE_SENT":
      return "INVOICE_SENT";
    case "BUILDING":
      return "BUILDING";
    case "DELIVERED":
      return "DELIVERED";
    case "WON":
      return "WON";
    case "LOST":
      return "LOST";
  }
}

export function pipelineStepIndex(status: ClientStatus): number {
  switch (status) {
    case "LEAD":
      return 0;
    case "CONTACTED":
    case "INTERESTED":
      return 1;
    case "QUESTIONNAIRE_SENT":
      return 2;
    case "QUESTIONNAIRE_DONE":
      return 3;
    case "PORTAL_SENT":
    case "VIEWED":
      return 4;
    case "TEMPLATE_SELECTED":
      return 5;
    case "INVOICE_SENT":
      return 6;
    case "BUILDING":
      return 7;
    case "DELIVERED":
      return 8;
    case "WON":
      return 9;
    case "LOST":
      return 0;
  }
}
