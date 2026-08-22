// Seeds reference data (categories) and the admin user from env vars.
// Never seeds fake business data like templates or clients.
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

async function main() {
  await seedCategories();
  await seedAdminUser();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
