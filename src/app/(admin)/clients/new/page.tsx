import { PageHeader } from "@/components/admin/page-header";
import { ClientForm } from "@/components/admin/client-form";
import { createClient } from "@/lib/actions/clients";

export const dynamic = "force-dynamic";

export default function NewClientPage() {
  return (
    <div>
      <PageHeader
        title="Add New Client"
        subtitle="Create a client and send them a personalized template selection portal."
      />
      <ClientForm action={createClient} submitLabel="Create Client" cancelHref="/clients" />
    </div>
  );
}
