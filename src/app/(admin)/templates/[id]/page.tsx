import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { TemplateForm } from "@/components/admin/template-form";
import { DeleteTemplateButton } from "@/components/admin/delete-template-button";
import { Button } from "@/components/ui/button";
import { updateTemplate } from "@/lib/actions/templates";

export const dynamic = "force-dynamic";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [template, categories] = await Promise.all([
    db.template.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!template) notFound();

  const boundUpdate = updateTemplate.bind(null, template.id);

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div>
      <PageHeader
        title={template.name}
        subtitle={`Added ${dateFormatter.format(template.createdAt)} · Last updated ${dateFormatter.format(template.updatedAt)}`}
        actions={
          <div className="flex items-center gap-2">
            {template.previewUrl ? (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<a href={template.previewUrl} target="_blank" rel="noopener noreferrer" />}
              >
                View Preview
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            <DeleteTemplateButton templateId={template.id} templateName={template.name} />
          </div>
        }
      />

      <TemplateForm
        action={boundUpdate}
        categories={categories}
        submitLabel="Save Changes"
        cancelHref="/templates"
        defaultValues={{
          name: template.name,
          slug: template.slug,
          categoryId: template.categoryId ?? "",
          status: template.status,
          description: template.description ?? "",
          tags: template.tags.map((t) => t.tag.name).join(", "),
          thumbnailUrl: template.thumbnailUrl ?? "",
          desktopScreenshotUrl: template.desktopScreenshotUrl ?? "",
          mobileScreenshotUrl: template.mobileScreenshotUrl ?? "",
          previewUrl: template.previewUrl ?? "",
          repositoryUrl: template.repositoryUrl ?? "",
        }}
      />
    </div>
  );
}
