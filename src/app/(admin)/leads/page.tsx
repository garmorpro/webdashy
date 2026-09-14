import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LeadsView } from "@/components/admin/leads-view";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/leads");

  const rows = await db.lead.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
  const leads = rows.map((lead) => ({
    ...lead,
    googleRating: lead.googleRating === null ? null : Number(lead.googleRating),
    lastContactedAt: lead.lastContactedAt?.toISOString().slice(0, 10) ?? null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  }));

  return <LeadsView leads={leads} />;
}
