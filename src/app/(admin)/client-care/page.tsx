import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ClientCarePage() {
  const enrollments = await db.clientCareEnrollment.findMany({
    where: {
      disposition: {
        in: ["ENROLLED", "INCLUDED"],
      },
    },
    include: {
      client: true,
      portal: {
        include: {
          delivery: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted">
            <HeartHandshake className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Client Care
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage active care clients, subscriptions, requests, and ongoing support.
            </p>
          </div>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8">
          <h2 className="text-lg font-bold">No active Client Care accounts</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Clients will appear here after they enroll in Client Care during handoff.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_140px_130px] gap-4 border-b bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <div>Client</div>
            <div>Plan</div>
            <div>Monthly</div>
            <div>Status</div>
          </div>

          <div className="divide-y">
            {enrollments.map((enrollment) => (
              <Link
                key={enrollment.id}
                href={`/clients/${enrollment.clientId}/client-care`}
                className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_140px_130px] gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-foreground">
                    {enrollment.client.businessName}
                  </div>
                  <div className="truncate text-sm text-muted-foreground">
                    {enrollment.client.contactName}
                  </div>
                </div>

                <div className="self-center text-sm">
                  {enrollment.planNameSnapshot || "Client Care"}
                </div>

                <div className="self-center text-sm font-medium">
                  {enrollment.monthlyAmountSnapshot
                    ? money.format(Number(enrollment.monthlyAmountSnapshot))
                    : "—"}
                </div>

                <div className="self-center">
                  <Badge variant="secondary">
                    {enrollment.disposition === "ENROLLED" ? "Active" : "Included"}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
