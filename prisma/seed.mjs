// Seeds reference data only (categories) — never fake business data like
// templates or clients. Run with `npm run db:seed`.
import { PrismaClient } from "@prisma/client";

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

async function main() {
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

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
