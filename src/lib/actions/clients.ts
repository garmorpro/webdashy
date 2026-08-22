"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { normalizeUrl } from "@/lib/utils";
import { ClientStatus } from "@prisma/client";

export type ClientActionState = { error?: string };

function readClientFields(formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "").trim();

  const estimatedValueRaw = get("estimatedValue");
  const websiteRaw = get("website");

  return {
    businessName: get("businessName"),
    contactName: get("contactName"),
    email: get("email"),
    phone: get("phone") || null,
    website: websiteRaw ? normalizeUrl(websiteRaw) : null,
    industry: get("industry") || null,
    status: (get("status") || "LEAD") as ClientStatus,
    leadSource: get("leadSource") || null,
    estimatedValueRaw,
    notes: get("notes") || null,
  };
}

function parseEstimatedValue(raw: string): { value: number | null; error?: string } {
  if (!raw) return { value: null };
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0) {
    return { value: null, error: "Estimated project value must be a positive number." };
  }
  return { value: n };
}

export async function createClient(
  _prevState: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  const fields = readClientFields(formData);

  if (!fields.businessName) return { error: "Business name is required." };
  if (!fields.contactName) return { error: "Contact name is required." };
  if (!fields.email) return { error: "Email is required." };

  const { value: estimatedValue, error: valueError } = parseEstimatedValue(
    fields.estimatedValueRaw
  );
  if (valueError) return { error: valueError };

  let created;
  try {
    created = await db.client.create({
      data: {
        businessName: fields.businessName,
        contactName: fields.contactName,
        email: fields.email,
        phone: fields.phone,
        website: fields.website,
        industry: fields.industry,
        status: fields.status,
        leadSource: fields.leadSource,
        estimatedValue,
        notes: fields.notes,
      },
    });
  } catch (err) {
    console.error("createClient failed:", err);
    return { error: "Something went wrong saving the client. Please try again." };
  }

  revalidatePath("/clients");
  redirect(`/clients/${created.id}`);
}

export async function updateClient(
  clientId: string,
  _prevState: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  const fields = readClientFields(formData);

  if (!fields.businessName) return { error: "Business name is required." };
  if (!fields.contactName) return { error: "Contact name is required." };
  if (!fields.email) return { error: "Email is required." };

  const { value: estimatedValue, error: valueError } = parseEstimatedValue(
    fields.estimatedValueRaw
  );
  if (valueError) return { error: valueError };

  try {
    await db.client.update({
      where: { id: clientId },
      data: {
        businessName: fields.businessName,
        contactName: fields.contactName,
        email: fields.email,
        phone: fields.phone,
        website: fields.website,
        industry: fields.industry,
        status: fields.status,
        leadSource: fields.leadSource,
        estimatedValue,
        notes: fields.notes,
      },
    });
  } catch (err) {
    console.error("updateClient failed:", err);
    return { error: "Something went wrong saving the client. Please try again." };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function deleteClient(clientId: string) {
  try {
    // Client -> Portal is onDelete: Cascade, so this also removes any
    // portals (and their events/selections) for this client.
    await db.client.delete({ where: { id: clientId } });
  } catch (err) {
    console.error("deleteClient failed:", err);
    throw new Error("Something went wrong deleting the client. Please try again.");
  }

  revalidatePath("/clients");
  redirect("/clients");
}
