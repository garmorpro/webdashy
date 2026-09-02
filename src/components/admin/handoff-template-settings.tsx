"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { publishHandoffTemplateAction, type HandoffActionState } from "@/lib/actions/handoff";
function Publish() { const { pending } = useFormStatus(); return <Button size="sm" type="submit" disabled={pending}>{pending ? "Publishing…" : "Publish revision"}</Button>; }
export function HandoffTemplateSettings({ revisions }: { revisions: { id: string; revision: number; status: string; templateName: string }[] }) {
  const draft = revisions.find((item) => item.status === "DRAFT"); const action = draft ? publishHandoffTemplateAction.bind(null, draft.id) : async (): Promise<HandoffActionState> => ({}); const [state, formAction] = useActionState(action, {});
  return <form action={formAction} className="rounded-xl bg-card p-6"><h2 className="text-sm font-extrabold">Launch &amp; Handoff Template</h2><p className="mt-1 text-xs text-muted-foreground">Publish the seeded revision for internal packet testing. Published content is immutable.</p><div className="mt-4 flex items-center justify-between gap-4"><p className="text-sm">{revisions[0] ? `${revisions[0].templateName} · revision ${revisions[0].revision} · ${revisions[0].status.toLowerCase()}` : "No default template revision found."}</p>{draft ? <Publish /> : null}</div>{state.error ? <p className="mt-3 text-sm text-destructive">{state.error}</p> : null}{state.success ? <p className="mt-3 text-sm text-emerald-600">{state.success}</p> : null}</form>;
}
