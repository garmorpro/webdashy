"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { TemplateStatus } from "@prisma/client";

export type TemplateActionState = { error?: string };

function parseTags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    )
  );
}

function readTemplateFields(formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "").trim();

  return {
    name: get("name"),
    slugInput: get("slug"),
    categoryId: get("categoryId"),
    status: (get("status") || "DRAFT") as TemplateStatus,
    description: get("description") || null,
    thumbnailUrl: get("thumbnailUrl") || null,
    desktopScreenshotUrl: get("desktopScreenshotUrl") || null,
    mobileScreenshotUrl: get("mobileScreenshotUrl") || null,
    previewUrl: get("previewUrl") || null,
    repositoryUrl: get("repositoryUrl") || null,
    tags: parseTags(get("tags")),
  };
}

async function syncTags(templateId: string, tagNames: string[]) {
  // Simplest correct approach for a short tag list: drop existing links and
  // recreate, rather than diffing. Fine at this scale.
  await db.templateTag.deleteMany({ where: { templateId } });
  for (const name of tagNames) {
    const tag = await db.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    await db.templateTag.create({ data: { templateId, tagId: tag.id } });
  }
}

export async function createTemplate(
  _prevState: TemplateActionState,
  formData: FormData
): Promise<TemplateActionState> {
  const fields = readTemplateFields(formData);

  if (!fields.name) return { error: "Template name is required." };
  if (!fields.categoryId) return { error: "Category is required." };

  const slug = slugify(fields.slugInput || fields.name);
  if (!slug) return { error: "Couldn't generate a slug from that name — try adding a letter or number." };

  const existing = await db.template.findUnique({ where: { slug } });
  if (existing) {
    return { error: `Slug "${slug}" is already in use by another template. Choose a different name or slug.` };
  }

  let created;
  try {
    created = await db.template.create({
      data: {
        name: fields.name,
        slug,
        categoryId: fields.categoryId,
        status: fields.status,
        description: fields.description,
        thumbnailUrl: fields.thumbnailUrl,
        desktopScreenshotUrl: fields.desktopScreenshotUrl,
        mobileScreenshotUrl: fields.mobileScreenshotUrl,
        previewUrl: fields.previewUrl,
        repositoryUrl: fields.repositoryUrl,
      },
    });
    await syncTags(created.id, fields.tags);
  } catch (err) {
    console.error("createTemplate failed:", err);
    return { error: "Something went wrong saving the template. Please try again." };
  }

  revalidatePath("/templates");
  redirect(`/templates/${created.id}`);
}

export async function updateTemplate(
  templateId: string,
  _prevState: TemplateActionState,
  formData: FormData
): Promise<TemplateActionState> {
  const fields = readTemplateFields(formData);

  if (!fields.name) return { error: "Template name is required." };
  if (!fields.categoryId) return { error: "Category is required." };

  const slug = slugify(fields.slugInput || fields.name);
  if (!slug) return { error: "Couldn't generate a slug from that name — try adding a letter or number." };

  const existing = await db.template.findUnique({ where: { slug } });
  if (existing && existing.id !== templateId) {
    return { error: `Slug "${slug}" is already in use by another template. Choose a different name or slug.` };
  }

  try {
    await db.template.update({
      where: { id: templateId },
      data: {
        name: fields.name,
        slug,
        categoryId: fields.categoryId,
        status: fields.status,
        description: fields.description,
        thumbnailUrl: fields.thumbnailUrl,
        desktopScreenshotUrl: fields.desktopScreenshotUrl,
        mobileScreenshotUrl: fields.mobileScreenshotUrl,
        previewUrl: fields.previewUrl,
        repositoryUrl: fields.repositoryUrl,
      },
    });
    await syncTags(templateId, fields.tags);
  } catch (err) {
    console.error("updateTemplate failed:", err);
    return { error: "Something went wrong saving the template. Please try again." };
  }

  revalidatePath("/templates");
  revalidatePath(`/templates/${templateId}`);
  redirect(`/templates/${templateId}`);
}

export async function setTemplateStatus(templateId: string, status: TemplateStatus) {
  await db.template.update({ where: { id: templateId }, data: { status } });
  revalidatePath("/templates");
  revalidatePath(`/templates/${templateId}`);
}

export async function toggleTemplateFavorite(templateId: string, isFavorite: boolean) {
  await db.template.update({ where: { id: templateId }, data: { isFavorite } });
  revalidatePath("/templates");
}

export async function deleteTemplate(templateId: string) {
  try {
    await db.template.delete({ where: { id: templateId } });
  } catch (err) {
    // TemplateSelection.templateId is onDelete: Restrict — a template a
    // client has actually selected can't be hard-deleted, to preserve that
    // historical record. Archive it instead.
    const code = (err as { code?: string } | null)?.code;
    if (code === "P2003" || code === "P2014") {
      throw new Error(
        "This template can't be deleted because a client has selected it. Archive it instead to hide it from new portals."
      );
    }
    console.error("deleteTemplate failed:", err);
    throw new Error("Something went wrong deleting the template. Please try again.");
  }

  revalidatePath("/templates");
  redirect("/templates");
}
