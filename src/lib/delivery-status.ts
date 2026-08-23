import type { DeliveryStatus, ReviewStatus, ContentStatus } from "@prisma/client";

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  BUILDING: "Building",
  DELIVERED: "Delivered",
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  AWAITING: "Awaiting client review",
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes requested",
};

export const REVIEW_STATUS_STYLES: Record<ReviewStatus, string> = {
  AWAITING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  CHANGES_REQUESTED: "bg-rose-50 text-rose-700",
};

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  CLIENT_PROVIDED: "Client will provide copy & photos",
  NEEDS_COPYWRITING: "Need copywriting help",
  MIXED: "Mixed — some provided, some needed",
};
