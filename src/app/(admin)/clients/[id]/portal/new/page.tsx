import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { PortalForm } from "@/components/admin/portal-form";
import { createPortal } from "@/lib/actions/portals";

export const dynamic = "force-dynamic";

export default async function NewPortalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [client, templates] = await Promise.all([
    db.client.findUnique({ where: { id } }),
    db.template.findMany({
      where: { status: "ACTIVE" },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!client) notFound();

  const boundCreate = createPortal.bind(null, client.id);

  return (
    <div>
      <PageHeader
        title={`Create Portal for ${client.businessName}`}
        subtitle="Pick a curated set of templates and generate a unique link for this client."
      />
      <PortalForm
        action={boundCreate}
        templates={templates}
        submitLabel="Generate Client Portal"
        cancelHref={`/clients/${client.id}`}
      />
    </div>
  );
}
