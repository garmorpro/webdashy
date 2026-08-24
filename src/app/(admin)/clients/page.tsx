import { db } from "@/lib/db";
import { ClientsView } from "@/components/admin/clients-view";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [clients, templates] = await Promise.all([
    db.client.findMany({ orderBy: { createdAt: "desc" } }),
    db.template.findMany({
      where: { status: "ACTIVE" },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <ClientsView clients={clients} templates={templates} />;
}
