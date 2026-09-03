// Seeds reference data and the admin user from env vars.
// Never seeds fake client or project data.
// Run with `npm run db:seed`.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { HANDOFF_ACCEPTANCE_TEXT, HANDOFF_REVISION_3_ACCEPTANCE_TEXT, HANDOFF_TEMPLATE_MODULES, HANDOFF_TEMPLATE_REVISION_3_MODULES } from "../src/lib/services/handoff-template-content.mjs";

const db = new PrismaClient();

// Mirrors product-build.md §4 (excluding "All", which is a UI-only filter).
const categories = [
  "Business",
  "Local Services",
  "Construction",
  "Restaurant",
  "Ecommerce",
  "Portfolio",
  "Health & Wellness",
  "Professional Services",
  "Other",
];

const HANDOFF_TEMPLATE_SLUG = "webdashy-default-handoff";
const legacyHandoffSections = [
  ["project_completion_summary", "Project Completion Summary", "Project", true, false],
  ["website_handoff_summary", "Website Handoff Summary", "Project", true, false],
  ["website_ownership_agreement", "Website Ownership Agreement", "Ownership", true, false],
  ["client_responsibilities_agreement", "Client Responsibilities Agreement", "Responsibilities", true, false],
  ["privacy_data_responsibility_notice", "Privacy & Data Responsibility Notice", "Privacy & Compliance", true, false],
  ["third_party_services_disclosure", "Third-Party Services Disclosure", "Services", true, false],
  ["maintenance_support_terms", "Maintenance & Support Terms", "Support", true, false],
  ["warranty_post_launch_support_terms", "Warranty / Post-Launch Support Terms", "Support", true, false],
  ["final_acceptance_sign_off", "Final Acceptance & Sign-Off", "Acceptance", true, true],
  ["domain_ownership_renewal_agreement", "Domain Ownership & Renewal Agreement", "Ownership", false, false],
  ["source_code_repository_handoff", "Source Code / Repository Handoff", "Technical", false, false],
  ["hosting_deployment_handoff", "Hosting / Deployment Handoff", "Technical", false, false],
  ["analytics_cookies_responsibility_notice", "Analytics & Cookies Responsibility Notice", "Privacy & Compliance", false, false],
  ["forms_customer_data_responsibility_notice", "Forms & Customer Data Responsibility Notice", "Privacy & Compliance", false, false],
  ["accessibility_responsibility_notice", "Accessibility Responsibility Notice", "Privacy & Compliance", false, false],
  ["security_backup_responsibility_notice", "Security & Backup Responsibility Notice", "Responsibilities", false, false],
  ["client_care_maintenance_plan_agreement", "Client Care / Maintenance Plan Agreement", "Support", false, false],
].map(([key, title, category, defaultIncluded, required]) => ({ key, title, category, defaultIncluded, required, description: "Counsel-reviewed language to be added before production use.", content: "Counsel-reviewed language to be added before production use." }));

const handoffAcceptancePlaceholder =
  "PLACEHOLDER ONLY — production acceptance wording requires counsel and business review before use.";

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function seedCategories() {
  for (const name of categories) {
    const slug = slugify(name);
    await db.category.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
  }
  console.log(`Seeded ${categories.length} categories.`);
}

async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.warn(
      "ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user seed. " +
        "You won't be able to log in until this is run with those set."
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Upsert (not just create) so re-running the seed with a new
  // ADMIN_PASSWORD resets the password — a simple way to recover access.
  await db.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });
  console.log(`Seeded admin user (${email}).`);
}

async function seedAppSettings() {
  // Ensures the singleton row exists — getAppSettings() also
  // upserts defensively, but seeding it here keeps a fresh deploy from
  // ever touching a database with zero rows in this table.
  await db.appSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  console.log("Seeded app settings.");
}

async function seedDefaultHandoffTemplate() {
  const template = await db.handoffTemplate.upsert({
    where: { slug: HANDOFF_TEMPLATE_SLUG },
    update: { name: "WebDashy Default Handoff", isDefault: true },
    create: {
      name: "WebDashy Default Handoff",
      slug: HANDOFF_TEMPLATE_SLUG,
      isDefault: true,
    },
  });

  await db.handoffTemplateRevision.upsert({
    where: { templateId_revision: { templateId: template.id, revision: 1 } },
    // Published revisions are immutable; rerunning seed must never rewrite one.
    update: {},
    create: {
      templateId: template.id,
      revision: 1,
      status: "DRAFT",
      schemaVersion: 1,
      sections: legacyHandoffSections,
      acceptanceText: handoffAcceptancePlaceholder,
    },
  });

  await db.handoffTemplateRevision.upsert({
    where: { templateId_revision: { templateId: template.id, revision: 2 } },
    // Never rewrite an existing revision: issued snapshots and revision history stay immutable.
    update: {},
    create: {
      templateId: template.id,
      revision: 2,
      status: "DRAFT",
      schemaVersion: 2,
      sections: HANDOFF_TEMPLATE_MODULES,
      acceptanceText: HANDOFF_ACCEPTANCE_TEXT,
    },
  });

  const revision3 = await db.handoffTemplateRevision.findUnique({
    where: { templateId_revision: { templateId: template.id, revision: 3 } },
  });
  const revision3Data = {
      templateId: template.id,
      revision: 3,
      status: "DRAFT",
      schemaVersion: 3,
      sections: HANDOFF_TEMPLATE_REVISION_3_MODULES,
      acceptanceText: HANDOFF_REVISION_3_ACCEPTANCE_TEXT,
  };
  if (!revision3) await db.handoffTemplateRevision.create({ data: revision3Data });
  // Revision 3 is intentionally refreshable only while it remains unpublished.
  else if (revision3.status === "DRAFT") await db.handoffTemplateRevision.update({ where: { id: revision3.id }, data: { schemaVersion: 3, sections: HANDOFF_TEMPLATE_REVISION_3_MODULES, acceptanceText: HANDOFF_REVISION_3_ACCEPTANCE_TEXT } });

  console.log("Seeded immutable revisions 1/2 and tailored draft revision 3 (pending review).");
}

async function main() {
  await seedCategories();
  await seedAdminUser();
  await seedAppSettings();
  await seedDefaultHandoffTemplate();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
