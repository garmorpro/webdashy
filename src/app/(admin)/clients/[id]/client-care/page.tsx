import Link from "next/link";
import { notFound } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function ClientCareDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await db.client.findUnique({
    where: { id },
    include: {
      clientCareEnrollments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          portal: {
            include: {
              delivery: true,
            },
          },
        },
      },
    },
  });

  if (!client) notFound();

  const enrollment = client.clientCareEnrollments[0] ?? null;

  if (!enrollment) notFound();

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <div>
      <div className="mb-3.5 text-xs font-semibold text-muted-foreground">
        <Link href="/client-care" className="hover:text-foreground hover:underline">
          Client Care
        </Link>{" "}
        / {client.businessName}
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <HeartHandshake className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              {client.businessName}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Client Care Workspace
            </p>
          </div>
        </div>

        <Badge variant="secondary">
          {enrollment.disposition === "ENROLLED" ? "Active" : enrollment.disposition}
        </Badge>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Plan
          </div>
          <div className="mt-2 text-lg font-bold">
            {enrollment.planNameSnapshot || "Client Care"}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Monthly
          </div>
          <div className="mt-2 text-lg font-bold">
            {enrollment.monthlyAmountSnapshot
              ? money.format(Number(enrollment.monthlyAmountSnapshot))
              : "Not set"}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Warranty
          </div>
          <div className="mt-2 text-lg font-bold">
            {enrollment.warrantyEndsAt
              ? enrollment.warrantyEndsAt.toLocaleDateString("en-US")
              : "Not set"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card">
        <Tabs defaultValue="overview">
          <div className="border-b px-5 pt-4">
            <TabsList variant="line" className="h-auto gap-5">
              <TabsTrigger value="overview" className="px-0 pb-3">
                Overview
              </TabsTrigger>
              <TabsTrigger value="requests" className="px-0 pb-3">
                Requests
              </TabsTrigger>
              <TabsTrigger value="activity" className="px-0 pb-3">
                Activity
              </TabsTrigger>
              <TabsTrigger value="communication" className="px-0 pb-3">
                Communication
              </TabsTrigger>
              <TabsTrigger value="billing" className="px-0 pb-3">
                Billing
              </TabsTrigger>
              <TabsTrigger value="website" className="px-0 pb-3">
                Website & Documents
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-5">
            <TabsContent value="overview">
              <h2 className="text-lg font-bold">Overview</h2>
              <p className="mt-1 text-muted-foreground">
                Client, plan, subscription, website, and service details.
              </p>
            </TabsContent>

            <TabsContent value="requests">
              <h2 className="text-lg font-bold">Requests</h2>
              <p className="mt-1 text-muted-foreground">
                Track ongoing website changes and support requests.
              </p>
            </TabsContent>

            <TabsContent value="activity">
              <h2 className="text-lg font-bold">Activity</h2>
              <p className="mt-1 text-muted-foreground">
                Permanent history of work completed for this client.
              </p>
            </TabsContent>

            <TabsContent value="communication">
              <h2 className="text-lg font-bold">Communication</h2>
              <p className="mt-1 text-muted-foreground">
                Send and retain branded client communications.
              </p>
            </TabsContent>

            <TabsContent value="billing">
              <h2 className="text-lg font-bold">Billing</h2>
              <p className="mt-1 text-muted-foreground">
                Manual Stripe overview and subscription information.
              </p>
            </TabsContent>

            <TabsContent value="website">
              <h2 className="text-lg font-bold">Website & Documents</h2>
              <p className="mt-1 text-muted-foreground">
                Website links, hosting details, agreements, and files.
              </p>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
