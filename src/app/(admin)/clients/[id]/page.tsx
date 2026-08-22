import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { ClientForm } from "@/components/admin/client-form";
import { DeleteClientButton } from "@/components/admin/delete-client-button";
import { updateClient } from "@/lib/actions/clients";
import { CLIENT_STATUS_LABELS } from "@/lib/client-status";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await db.client.findUnique({ where: { id } });
  if (!client) notFound();

  const boundUpdate = updateClient.bind(null, client.id);

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div>
      <PageHeader
        title={client.businessName}
        subtitle={`${CLIENT_STATUS_LABELS[client.status]} · Added ${dateFormatter.format(client.createdAt)} · Last updated ${dateFormatter.format(client.updatedAt)}`}
        actions={<DeleteClientButton clientId={client.id} clientName={client.businessName} />}
      />

      <ClientForm
        action={boundUpdate}
        submitLabel="Save Changes"
        cancelHref="/clients"
        defaultValues={{
          businessName: client.businessName,
          contactName: client.contactName,
          email: client.email,
          phone: client.phone ?? "",
          website: client.website ?? "",
          industry: client.industry ?? "",
          status: client.status,
          leadSource: client.leadSource ?? "",
          estimatedValue: client.estimatedValue?.toString() ?? "",
          notes: client.notes ?? "",
        }}
      />

      {/* Template Portal section lands in Phase 4 (Portal Builder) — see
          ROADMAP.md. Intentionally not stubbed here to avoid a
          non-functional "Create Portal" button. */}
    </div>
  );
}
