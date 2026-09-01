import { db } from "@/lib/db";
import { advanceClientWorkflow } from "@/lib/services/client-workflow";
import { isLaunchHandoffReady } from "@/lib/services/launch-handoff-readiness-state.mjs";

/**
 * Synchronizes the canonical workflow once the client has approved the site
 * and every invoice for this project is paid. Those facts make the project
 * eligible for Launch & Handoff; they do not complete the project and must
 * never set the legacy status to WON or advance directly to Client Care.
 */
export async function synchronizeLaunchHandoffReadiness(
  clientId: string,
  portalId: string
): Promise<void> {
  const [portal, delivery, invoiceCount, unpaidInvoiceCount] = await Promise.all([
    db.portal.findFirst({ where: { id: portalId, clientId }, select: { id: true } }),
    db.delivery.findUnique({ where: { portalId }, select: { reviewStatus: true } }),
    db.invoice.count({ where: { portalId } }),
    db.invoice.count({ where: { portalId, status: { not: "PAID" } } }),
  ]);

  if (!portal) return;
  if (!isLaunchHandoffReady({
    reviewApproved: delivery?.reviewStatus === "APPROVED",
    invoiceCount,
    unpaidInvoiceCount,
  })) return;

  await advanceClientWorkflow(clientId, "PAYMENT_RECEIVED");
}
