import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HandoffDraftPreview } from "@/components/admin/handoff-draft-preview";
import { findDraftHandoffPreview } from "@/lib/services/handoff-preview";

export const dynamic = "force-dynamic";

export default async function DraftHandoffPreviewPage({ params, searchParams }: { params:Promise<{id:string}>;searchParams:Promise<{revisionId?:string}> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!query.revisionId) notFound();
  const preview = await findDraftHandoffPreview(id, query.revisionId);
  if (!preview) notFound();
  const initiallySelected = preview.snapshot.policyModules?.map((module)=>module.key) ?? [];
  const facts = preview.snapshot.handoffFacts as {client?:{businessName?:string};project?:{name?:string};website?:{liveUrl?:string;domain?:string}};
  return <div className="mx-auto max-w-6xl space-y-6"><div><Button nativeButton={false} variant="outline" render={<Link href={`/clients/${id}#section-launch-handoff`} />}>← Back to Launch &amp; Handoff</Button></div><header className="rounded-xl border border-violet-300 bg-violet-50 p-6 dark:border-violet-800 dark:bg-violet-950/30"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-violet-700 dark:text-violet-300">{preview.templateName}</p><h1 className="mt-1 text-2xl font-extrabold">Draft Template Revision {preview.revision}</h1><p className="mt-2 text-sm text-muted-foreground">Preview only · Not issued</p></div><Badge variant="secondary">Admin preview</Badge></div><p className="mt-4 text-sm">Current facts: {facts.client?.businessName ?? "Client"} · {facts.project?.name ?? "Website project"}{facts.website?.liveUrl ? ` · ${facts.website.liveUrl}` : facts.website?.domain ? ` · ${facts.website.domain}` : ""}</p><p className="mt-2 text-xs text-muted-foreground">This page reads current project records and the draft template. It does not create, update, issue, supersede, or send a handoff packet.</p></header><HandoffDraftPreview clientId={id} revisionId={preview.revisionId} revision={preview.revision} modules={preview.availableModules} previewDocumentKeys={initiallySelected} initialSelected={initiallySelected} recommendations={preview.recommendations}/></div>;
}
