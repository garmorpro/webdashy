import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { TemplateForm } from "@/components/admin/template-form";
import { createTemplate } from "@/lib/actions/templates";

export const dynamic = "force-dynamic";

export default async function NewTemplatePage() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="Add Template" subtitle="Add a new website template to your library." />
      <TemplateForm
        action={createTemplate}
        categories={categories}
        submitLabel="Create Template"
        cancelHref="/templates"
      />
    </div>
  );
}
