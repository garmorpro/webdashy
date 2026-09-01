"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Copy, ExternalLink, Hammer, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionLocked } from "@/components/admin/section-locked";
import {
  markWebsiteDraftReady,
  saveDeliveryUrls,
  sendClientReview,
  startBuilding,
} from "@/lib/actions/delivery";
import { REVIEW_STATUS_LABELS, REVIEW_STATUS_STYLES } from "@/lib/delivery-status";
import type { Delivery, DeliveryReview, WorkflowStage } from "@prisma/client";

type DeliveryWithReviews = Delivery & { reviews: DeliveryReview[] };

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? pendingLabel : label}</Button>;
}

function Card({ title, active, children }: { title: string; active?: boolean; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border bg-card p-5 ${active ? "border-primary shadow-[0_0_0_3px_rgba(164,255,79,0.18)]" : "border-border"}`}>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Hammer className="h-4 w-4 text-muted-foreground" />{title}
      </h2>
      {children}
    </div>
  );
}

function StartBuild({ portalId, clientId }: { portalId: string; clientId: string }) {
  const [pending, startTransition] = useTransition();
  return <Card title="Build Setup" active><p className="mt-2 text-sm text-muted-foreground">Build Setup is confirmed — ready to start the website draft.</p><Button className="mt-4" disabled={pending} onClick={() => startTransition(async () => { try { await startBuilding(portalId, clientId); } catch { toast.error("Couldn't update this project."); } })}>{pending ? "Starting..." : "Start Building"}</Button></Card>;
}

function DraftAndReview({ portalId, clientId, delivery, workflowStage, reviewUrl }: { portalId: string; clientId: string; delivery: DeliveryWithReviews; workflowStage: WorkflowStage; reviewUrl: string | null }) {
  const save = useActionState(saveDeliveryUrls.bind(null, portalId, clientId), {});
  const ready = useActionState(markWebsiteDraftReady.bind(null, portalId, clientId), {});
  const send = useActionState(sendClientReview.bind(null, portalId, clientId), {});
  const draftReady = workflowStage !== "BUILD_SETUP";
  const inReview = workflowStage === "CLIENT_REVIEW";
  const approved = workflowStage === "REVISIONS_APPROVED";
  const canSend = workflowStage === "WEBSITE_DRAFT" || (inReview && delivery.reviewStatus === "CHANGES_REQUESTED");
  const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

  function copyReviewLink() {
    if (!reviewUrl) return;
    navigator.clipboard.writeText(reviewUrl).then(() => toast.success("Review link copied")).catch(() => toast.error("Couldn't copy the link."));
  }

  return <div className="space-y-6">
    <Card title="Build Setup"><Badge variant="secondary" className="mt-2 bg-emerald-50 text-emerald-700">In progress</Badge></Card>
    <Card title="Website Draft" active={!draftReady}>
      <p className="mt-2 text-sm text-muted-foreground">Save the staging URL, then mark the first rough draft ready.</p>
      <form action={save[1]} className="mt-4 space-y-3">
        {save[0]?.error ? <p className="text-sm text-destructive">{save[0].error}</p> : null}
        <div className="space-y-1.5"><Label htmlFor="staging-url">Staging URL</Label><Input id="staging-url" name="stagingUrl" type="url" required defaultValue={delivery.stagingUrl ?? ""} placeholder="https://staging.example.com" /></div>
        <SubmitButton label="Save Staging URL" pendingLabel="Saving..." />
      </form>
      {!draftReady ? <form action={ready[1]} className="mt-3"><input type="hidden" name="stagingUrl" value={delivery.stagingUrl ?? ""} />{ready[0]?.error ? <p className="mb-2 text-sm text-destructive">{ready[0].error}</p> : null}<SubmitButton label="Mark Draft Ready" pendingLabel="Marking ready..." /></form> : <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />Draft marked ready</div>}
    </Card>
    <Card title="Client Review" active={workflowStage === "WEBSITE_DRAFT" || inReview}>
      {approved ? <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />Client approved the revisions{delivery.reviewedAt ? ` on ${dateFmt.format(delivery.reviewedAt)}` : ""}.</div> : null}
      {inReview ? <Badge variant="secondary" className={`mt-2 ${REVIEW_STATUS_STYLES[delivery.reviewStatus]}`}>{REVIEW_STATUS_LABELS[delivery.reviewStatus]}</Badge> : null}
      {delivery.reviewStatus === "CHANGES_REQUESTED" && delivery.reviewFeedback ? <div className="mt-3 rounded-lg border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-900"><div className="mb-1 flex items-center gap-2 font-semibold"><MessageCircle className="h-4 w-4" />Requested revisions</div>{delivery.reviewFeedback}</div> : null}
      {canSend ? <form action={send[1]} className="mt-4 space-y-3">{send[0]?.error ? <p className="text-sm text-destructive">{send[0].error}</p> : null}<input type="hidden" name="stagingUrl" value={delivery.stagingUrl ?? ""} /><SubmitButton label={delivery.reviews.length ? "Resend Updated Draft" : "Send Draft for Review"} pendingLabel="Sending..." /></form> : null}
      {reviewUrl ? <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"><code className="flex-1 truncate text-xs">{reviewUrl}</code><Button variant="outline" size="sm" onClick={copyReviewLink}><Copy className="h-3.5 w-3.5" />Copy</Button><Button variant="outline" size="sm" nativeButton={false} render={<a href={reviewUrl} target="_blank" rel="noopener noreferrer" />}><ExternalLink className="h-3.5 w-3.5" />Open</Button></div> : null}
      {delivery.reviews.length ? <div className="mt-5 border-t border-border pt-4"><h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Review history</h3><div className="mt-2 space-y-2">{delivery.reviews.map((review) => <div key={review.id} className="rounded-lg bg-secondary px-3 py-2 text-sm"><div className="flex justify-between gap-3"><span className="font-medium">Round {review.cycle}</span><span className="text-muted-foreground">{dateFmt.format(review.sentAt)}</span></div><div className="mt-1 text-muted-foreground">{REVIEW_STATUS_LABELS[review.status]} · {review.stagingUrl}</div>{review.feedback ? <p className="mt-1 text-foreground">“{review.feedback}”</p> : null}</div>)}</div></div> : null}
    </Card>
  </div>;
}

export function DeliverySection({ portalId, clientId, delivery, reviewUrl, workflowStage, locked }: { portalId: string; clientId: string; delivery: DeliveryWithReviews | null; reviewUrl: string | null; workflowStage: WorkflowStage; locked: boolean }) {
  if (locked) return <SectionLocked title="Build & Delivery" icon={Hammer} reason="Available once Build Setup is confirmed and website provisioning succeeds." />;
  if (!delivery) return <StartBuild portalId={portalId} clientId={clientId} />;
  return <DraftAndReview portalId={portalId} clientId={clientId} delivery={delivery} workflowStage={workflowStage} reviewUrl={reviewUrl} />;
}
