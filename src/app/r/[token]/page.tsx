import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PortalShell } from "@/components/portal/portal-shell";
import { ReviewActions } from "@/components/portal/review-actions";
import { ReviewOutcome } from "@/components/portal/review-outcome";

// Same reasoning as the template portal page — always live data, never
// statically prerendered.
export const dynamic = "force-dynamic";

async function getDelivery(token: string) {
  return db.delivery.findUnique({
    where: { reviewToken: token },
    include: { portal: { include: { client: true } } },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const delivery = await getDelivery(token);

  return {
    title: delivery
      ? `${delivery.portal.client.businessName} — Review Your Website`
      : "Review Your Website",
    // Same as the template portal — an unguessable-token page must never
    // be indexed. See ARCHITECTURE.md §6 / product-build.md §35.
    robots: { index: false, follow: false },
  };
}

export default async function DeliveryReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const delivery = await getDelivery(token);

  if (!delivery || delivery.status !== "DELIVERED" || !delivery.liveUrl) notFound();

  const { client } = delivery.portal;

  return (
    <PortalShell clientName={client.businessName} message={null}>
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          What do you think?
        </h2>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Take a look around, then let us know if it&apos;s ready to go or needs a few changes.
        </p>
      </div>

      <div className="mx-auto mb-10 max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="ml-2 truncate font-mono text-xs text-slate-500">{delivery.liveUrl}</span>
        </div>
        <a href={delivery.liveUrl} target="_blank" rel="noopener noreferrer" className="block">
          <div className="aspect-[16/9] w-full bg-gradient-to-br from-[#1b2951] via-slate-700 to-lime-300" />
        </a>
        <div className="border-t border-slate-200 px-4 py-3 text-center">
          <a
            href={delivery.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#1b2951] underline"
          >
            Visit the live site →
          </a>
        </div>
      </div>

      {delivery.reviewStatus === "AWAITING" ? (
        <ReviewActions reviewToken={token} />
      ) : (
        <ReviewOutcome
          approved={delivery.reviewStatus === "APPROVED"}
          feedback={delivery.reviewFeedback}
        />
      )}
    </PortalShell>
  );
}
