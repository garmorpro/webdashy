import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { PortalForm } from "@/components/admin/portal-form";
import { updatePortalTemplates } from "@/lib/actions/portals";

export const dynamic = "force-dynamic";

export default async function EditPortalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [client, templates] = await Promise.all([
    db.client.findUnique({
      where: { id },
      include: {
        portals: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { templates: true },
        },
      },
    }),
    db.template.findMany({
      where: { status: "ACTIVE" },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const portal = client?.portals[0];
  if (!client || !portal) notFound();

  const boundUpdate = updatePortalTemplates.bind(null, portal.id, client.id);

  return (
    <div>
      <PageHeader
        title={`Edit Portal for ${client.businessName}`}
        subtitle="Update the templates shared with this client, or tweak the message."
      />
      <PortalForm
        action={boundUpdate}
        templates={templates}
        defaultSelectedIds={portal.templates.map((t) => t.templateId)}
        defaultMessage={portal.message ?? undefined}
        submitLabel="Save Changes"
        cancelHref={`/clients/${client.id}`}
      />
    </div>
  );
}
