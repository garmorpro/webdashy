import { db } from "@/lib/db";
import { TemplatesClient } from "@/components/admin/templates-client";

// Reads live data on every request — must not be statically prerendered at
// build time (no database is reachable during `docker build`; see Dockerfile).
export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const [templates, categories] = await Promise.all([
    db.template.findMany({
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <TemplatesClient templates={templates} categories={categories} />;
}
