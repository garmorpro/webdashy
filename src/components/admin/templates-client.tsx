"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { TemplateCard, type TemplateWithRelations } from "@/components/admin/template-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Category } from "@prisma/client";

export function TemplatesClient({
  templates,
  categories,
}: {
  templates: TemplateWithRelations[];
  categories: Category[];
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesCategory =
        activeCategory === "All" || template.category?.name === activeCategory;

      if (!matchesCategory) return false;
      if (!q) return true;

      const haystack = [
        template.name,
        template.category?.name ?? "",
        ...template.tags.map((t) => t.tag.name),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [templates, query, activeCategory]);

  return (
    <div>
      <PageHeader
        title="All Templates"
        subtitle="Beautiful, customizable website templates to help your clients stand out."
        actions={
          <Button size="sm" render={<Link href="/templates/new" />}>
            <Plus className="h-4 w-4" />
            Add Template
          </Button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, category, or tag..."
          className="pl-9"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {["All", ...categories.map((c) => c.name)].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              activeCategory === category
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <p className="text-sm font-medium text-foreground">Build your template library</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add your first website template to start creating client portals.
          </p>
          <Button size="sm" className="mt-5" render={<Link href="/templates/new" />}>
            <Plus className="h-4 w-4" />
            Add Template
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <p className="text-sm font-medium text-foreground">No templates found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search term or category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
