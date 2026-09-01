// Seeds reference data and the admin user from env vars.
// Never seeds fake client or project data.
// Run with `npm run db:seed`.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
const HANDOFF_PLACEHOLDER_DESCRIPTION =
  "Counsel-reviewed language to be added before production use.";
const handoffSections = [
  ["project_summary", "Project Summary"],
  ["website_launch", "Website Launch"],
  ["domain", "Domain"],
  ["hosting", "Hosting"],
  ["source_code", "Source Code"],
  ["access_handoff", "Access Handoff"],
  ["ownership", "Ownership"],
  ["third_party_services", "Third-Party Services"],
  ["maintenance_support", "Maintenance & Support"],
  ["warranty", "Warranty"],
  ["operational_responsibilities", "Operational Responsibilities"],
  ["privacy_data_compliance", "Privacy, Data & Compliance"],
  ["acceptance", "Acceptance"],
].map(([id, heading]) => ({
  id,
  heading,
  description: HANDOFF_PLACEHOLDER_DESCRIPTION,
}));

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
    update: {
      status: "DRAFT",
      schemaVersion: 1,
      sections: handoffSections,
      acceptanceText: handoffAcceptancePlaceholder,
    },
    create: {
      templateId: template.id,
      revision: 1,
      status: "DRAFT",
      schemaVersion: 1,
      sections: handoffSections,
      acceptanceText: handoffAcceptancePlaceholder,
    },
  });

  console.log("Seeded default handoff template with a non-legal draft revision.");
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
