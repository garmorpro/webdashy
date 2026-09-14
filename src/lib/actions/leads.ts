"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLeadStatus } from "@/lib/lead-status";
import { normalizeUrl } from "@/lib/utils";

export type LeadActionState = { error?: string; success?: boolean };

function readLeadFields(formData: FormData, creating: boolean) {
  const get = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const businessName = get("businessName");
  if (!businessName) throw new Error("Business name is required.");

  const status = get("status") || (creating ? "NEW" : "");
  if (!isLeadStatus(status)) throw new Error("Choose a valid lead status.");

  const email = get("email") || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  function urlField(key: string, label: string) {
    const raw = get(key);
    if (!raw) return null;
    try {
      const url = new URL(normalizeUrl(raw));
      if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) {
        throw new Error();
      }
      return url.href;
    } catch {
      throw new Error(`${label} must be a valid http or https URL.`);
    }
  }

  const ratingRaw = get("googleRating");
  const googleRating = ratingRaw ? Number(ratingRaw) : null;
  if (googleRating !== null && (!/^\d+(?:\.\d)?$/.test(ratingRaw) || !Number.isFinite(googleRating) || googleRating < 0 || googleRating > 5)) {
    throw new Error("Google rating must be between 0 and 5, with at most one decimal place.");
  }
  const reviewsRaw = get("googleReviewCount");
  const googleReviewCount = reviewsRaw ? Number(reviewsRaw) : null;
  if (googleReviewCount !== null && (!/^\d+$/.test(reviewsRaw) || !Number.isInteger(googleReviewCount) || googleReviewCount > 2147483647)) {
    throw new Error("Google review count must be a nonnegative whole number up to 2,147,483,647.");
  }

  const dateRaw = get("lastContactedAt");
  const lastContactedAt = dateRaw ? new Date(`${dateRaw}T00:00:00.000Z`) : null;
  if (lastContactedAt && (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw) || !Number.isFinite(lastContactedAt.getTime()) || lastContactedAt.toISOString().slice(0, 10) !== dateRaw)) {
    throw new Error("Enter a valid last contacted date.");
  }

  return {
    businessName,
    phone: get("phone") || null,
    email,
    website: urlField("website", "Website"),
    address: get("address") || null,
    city: get("city") || null,
    googleMapsUrl: urlField("googleMapsUrl", "Google Maps URL"),
    businessCategory: get("businessCategory") || null,
    googleRating,
    googleReviewCount,
    status,
    notes: get("notes") || null,
    lastContactedAt,
  };
}

async function saveLead(formData: FormData, leadId?: string): Promise<LeadActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  let data;
  try {
    data = readLeadFields(formData, leadId === undefined);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Check the lead details." };
  }

  try {
    if (leadId !== undefined) {
      await db.lead.update({ where: { id: leadId }, data });
    } else {
      await db.lead.create({ data });
    }
  } catch (error) {
    console.error("saveLead failed:", error);
    return { error: "Couldn't save this lead. It may have been deleted. Please try again." };
  }
  revalidatePath("/leads");
  return { success: true };
}

export async function createLead(_state: LeadActionState, formData: FormData): Promise<LeadActionState> {
  return saveLead(formData);
}

export async function updateLead(leadId: string, _state: LeadActionState, formData: FormData): Promise<LeadActionState> {
  return saveLead(formData, leadId);
}

export async function updateLeadStatus(leadId: string, status: string): Promise<LeadActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };
  if (!isLeadStatus(status)) return { error: "Choose a valid lead status." };
  try {
    // Prospecting statuses have no Client or workflow side effects.
    await db.lead.update({ where: { id: leadId }, data: { status } });
  } catch (error) {
    console.error("updateLeadStatus failed:", error);
    return { error: "Couldn't change this lead's status. Please try again." };
  }
  revalidatePath("/leads");
  return { success: true };
}

export async function deleteLead(leadId: string): Promise<LeadActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };
  try {
    await db.lead.delete({ where: { id: leadId } });
  } catch (error) {
    console.error("deleteLead failed:", error);
    return { error: "Couldn't delete this lead. Please try again." };
  }
  revalidatePath("/leads");
  return { success: true };
}
