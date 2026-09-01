import { db } from "@/lib/db";
import { advanceClientWorkflow } from "@/lib/services/client-workflow";

/**
 * A project is "complete" (Client.status → WON) once both halves of step 8
 * are true: the client approved the delivered site AND every invoice tied
 * to that portal is paid. Either half can happen first — marking an
 * invoice paid, or the client approving — so both call sites (invoices.ts'
 * markInvoicePaid and the public approveDelivery action) check this after
 * their own write, and this is idempotent (a no-op once already WON).
 */
export async function maybeCompleteProject(clientId: string, portalId: string): Promise<void> {
  const [client, delivery, unpaidCount] = await Promise.all([
    db.client.findUnique({ where: { id: clientId } }),
    db.delivery.findUnique({ where: { portalId } }),
    db.invoice.count({ where: { portalId, status: { not: "PAID" } } }),
  ]);

  if (!client) return;
  if (delivery?.reviewStatus !== "APPROVED") return;
  if (unpaidCount > 0) return;

  await db.$transaction(async (tx) => {
    if (client.status !== "WON") {
      await tx.client.update({ where: { id: clientId }, data: { status: "WON" } });
    }
    await advanceClientWorkflow(clientId, "CLIENT_CARE", tx);
  });
}
