"use server";

import { Prisma, RepositoryVisibility } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { QuestionnaireAnswers } from "@/lib/questionnaire-schema";

export type BuildSetupActionState = { error?: string; success?: string; confirmed?: boolean };

type PageSpec = { name: string; source: "requirements" | "questionnaire"; status: "CONFIRMED" | "SUGGESTED" };
type FeatureSpec = { name: string; source: "requirements"; status: "CONFIRMED" };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "website";
}

function answerMap(value: Prisma.JsonValue | null): QuestionnaireAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, answer]) => [key, typeof answer === "string" ? answer.trim() : ""]));
}

function splitSuggestions(value: string): string[] {
  return value.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean);
}

function nullable(value: FormDataEntryValue | null) {
  const result = String(value ?? "").trim();
  return result || null;
}

async function adminId() {
  return (await auth())?.user?.id ?? null;
}

export async function generateBuildSetup(
  portalId: string,
  clientId: string,
  _state: BuildSetupActionState
): Promise<BuildSetupActionState> {
  if (!(await adminId()))  void _state;
  if (!(await adminId())) return { error: "You must be signed in." };

  const portal = await db.portal.findFirst({
    where: { id: portalId, clientId },
    include: {
      client: { include: { questionnaire: true } },
      selection: { include: { template: true, plan: true } },
      requirements: true,
      buildSetup: { select: { id: true, status: true } },
    },
  });
  if (!portal) return { error: "Portal not found for this client." };
  if (portal.buildSetup) return { error: "A Build Setup already exists. Existing admin work was not changed." };
  if (!portal.selection || !portal.requirements) {
    return { error: "Save Template & Plan and Project Requirements before generating Build Setup." };
  }

  const questionnaire = portal.client.questionnaire?.status === "SUBMITTED" ? portal.client.questionnaire : null;
  const answers = answerMap(questionnaire?.answers ?? null);
  const projectName = answers.displayedBusinessName || answers.companyName || portal.client.businessName;
  const pageNames = portal.requirements.pages.length ? portal.requirements.pages : splitSuggestions(answers.desiredPages || "");
  const pageSource = portal.requirements.pages.length ? "requirements" : "questionnaire";
  const pages: PageSpec[] = pageNames.map((name) => ({
    name,
    source: pageSource,
    status: pageSource === "requirements" ? "CONFIRMED" : "SUGGESTED",
  }));
  const features: FeatureSpec[] = portal.requirements.features.map((name) => ({ name, source: "requirements", status: "CONFIRMED" }));
  const unresolvedItems: string[] = [];
  if (!portal.selection.template.repositoryUrl) unresolvedItems.push("Add the template repository URL before confirmation.");
  if (!pages.length) unresolvedItems.push("Confirm at least one page before confirmation.");
  if (!questionnaire) unresolvedItems.push("No submitted questionnaire was available; review public business and brief details manually.");

  try {
    await db.buildSetup.create({
      data: {
        portalId,
        templateSelectionId: portal.selection.id,
        projectRequirementsId: portal.requirements.id,
        questionnaireId: questionnaire?.id,
        projectName,
        siteSlug: slugify(projectName),
        repositoryName: `client-${slugify(projectName)}`,
        sourceRepositoryUrl: portal.selection.template.repositoryUrl ?? "",
        primaryDomain: answers.domain || null,
        existingWebsiteUrl: portal.client.website || answers.domain || null,
        templateId: portal.selection.template.id,
        templateNameSnapshot: portal.selection.template.name,
        templateSlugSnapshot: portal.selection.template.slug,
        planId: portal.selection.plan?.id,
        planNameSnapshot: portal.selection.plan?.name,
        planFeaturesSnapshot: portal.selection.plan?.features ?? [],
        businessProfile: {
          businessName: answers.displayedBusinessName || projectName,
          address: answers.displayedBusinessAddress || "",
          phone: answers.displayedPhone || "",
          email: answers.displayedEmail || "",
          hours: answers.businessHours || "",
          serviceAreas: answers.areasServed || "",
          socialMedia: answers.socialMedia || "",
          internalContact: { name: portal.client.contactName, email: portal.client.email, phone: portal.client.phone || "" },
        },
        pages,
        features,
        contentStatus: portal.requirements.contentStatus,
        contentBrief: {
          story: answers.story || "", services: answers.topServices || "", supportingServices: answers.otherServices || "",
          audience: answers.idealCustomer || "", keyInformation: answers.keyInfo || "", callsToAction: answers.callsToAction || "",
          updates: answers.pagesNeedingUpdates || "", other: answers.otherContentDetails || "",
        },
        designBrief: {
          aesthetic: answers.aesthetic || "", branding: answers.existingBranding || "", references: answers.referenceWebsites || "",
          competitors: answers.competitorLinks || "", other: answers.otherDesignDetails || "",
        },
        targetLaunchDate: portal.requirements.targetLaunchDate,
        notes: portal.requirements.notes,
        unresolvedItems,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "A Build Setup was created concurrently. Existing data was not changed." };
    }
    console.error("generateBuildSetup failed:", error);
    return { error: "Unable to generate Build Setup." };
  }
  revalidatePath(`/clients/${clientId}`);
  return { success: "Build Setup draft generated." };
}

function jsonObject(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function saveBuildSetup(
  setupId: string,
  portalId: string,
  clientId: string,
  _state: BuildSetupActionState,
  formData: FormData
): Promise<BuildSetupActionState> {
  const userId = await adminId();
  if (!userId) return { error: "You must be signed in." };
  const existing = await db.buildSetup.findFirst({ where: { id: setupId, portalId, portal: { clientId } } });
  if (!existing) return { error: "Build Setup not found for this client." };

  const projectName = String(formData.get("projectName") ?? "").trim();
  const siteSlug = slugify(String(formData.get("siteSlug") ?? ""));
  const repositoryName = String(formData.get("repositoryName") ?? "").trim();
  const sourceRepositoryUrl = String(formData.get("sourceRepositoryUrl") ?? "").trim();
  const pageNames = splitSuggestions(String(formData.get("pages") ?? ""));
  const featureNames = splitSuggestions(String(formData.get("features") ?? ""));
  const intent = String(formData.get("intent") ?? "save");
  if (intent === "confirm" && (!projectName || !siteSlug || !repositoryName || !sourceRepositoryUrl || !existing.templateId || !pageNames.length)) {
    return { error: "Project name, site slug, repository name, source repository, selected template, and at least one page are required." };
  }

  const businessProfile = jsonObject(existing.businessProfile);
  const contentBrief = jsonObject(existing.contentBrief);
  const designBrief = jsonObject(existing.designBrief);
  const data = {
    projectName, siteSlug, repositoryName,
    repositoryOwner: nullable(formData.get("repositoryOwner")),
    repositoryVisibility: String(formData.get("repositoryVisibility")) === "PUBLIC" ? RepositoryVisibility.PUBLIC : RepositoryVisibility.PRIVATE,
    sourceRepositoryUrl, sourceRef: nullable(formData.get("sourceRef")),
    primaryDomain: nullable(formData.get("primaryDomain")), existingWebsiteUrl: nullable(formData.get("existingWebsiteUrl")),
    businessProfile: { ...businessProfile, businessName: nullable(formData.get("businessName")) ?? "", address: nullable(formData.get("address")) ?? "", phone: nullable(formData.get("publicPhone")) ?? "", email: nullable(formData.get("publicEmail")) ?? "", hours: nullable(formData.get("hours")) ?? "", serviceAreas: nullable(formData.get("serviceAreas")) ?? "" },
    pages: pageNames.map((name) => ({ name, source: "admin", status: "CONFIRMED" })),
    features: featureNames.map((name) => ({ name, source: "admin", status: "CONFIRMED" })),
    contentBrief: { ...contentBrief, story: nullable(formData.get("story")) ?? "", services: nullable(formData.get("services")) ?? "", audience: nullable(formData.get("audience")) ?? "", keyInformation: nullable(formData.get("keyInformation")) ?? "", callsToAction: nullable(formData.get("callsToAction")) ?? "", updates: nullable(formData.get("updates")) ?? "", other: nullable(formData.get("contentOther")) ?? "" },
    designBrief: { ...designBrief, aesthetic: nullable(formData.get("aesthetic")) ?? "", branding: nullable(formData.get("branding")) ?? "", references: nullable(formData.get("references")) ?? "", competitors: nullable(formData.get("competitors")) ?? "", other: nullable(formData.get("designOther")) ?? "" },
    targetLaunchDate: nullable(formData.get("targetLaunchDate")) ? new Date(String(formData.get("targetLaunchDate"))) : null,
    notes: nullable(formData.get("notes")),
    unresolvedItems: splitSuggestions(String(formData.get("unresolvedItems") ?? "")),
    status: intent === "confirm" ? "CONFIRMED" as const : "DRAFT" as const,
    confirmedAt: intent === "confirm" ? new Date() : null,
    confirmedByUserId: intent === "confirm" ? userId : null,
  };

  try {
    await db.buildSetup.update({ where: { id: setupId }, data });
  } catch (error) {
    console.error("saveBuildSetup failed:", error);
    return { error: intent === "confirm" ? "Unable to confirm Build Setup." : "Unable to save Build Setup." };
  }
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { success: intent === "confirm" ? "Build Setup confirmed." : "Build Setup draft saved.", confirmed: intent === "confirm" };
}
