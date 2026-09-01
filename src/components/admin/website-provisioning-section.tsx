"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, CheckCircle2, ExternalLink, GitBranch, LoaderCircle } from "lucide-react";
import type { BuildSetup, WebsiteProvisioning } from "@prisma/client";
import { provisionWebsiteAction } from "@/lib/actions/website-provisioning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionLocked } from "@/components/admin/section-locked";

type Props = { portalId: string; clientId: string; setup: BuildSetup | null; provisioning: WebsiteProvisioning | null };
function Submit({ retry }: { retry: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? <><LoaderCircle className="h-4 w-4 animate-spin" />Provisioning...</> : retry ? "Retry Provisioning" : "Provision Website"}</Button>;
}
export function WebsiteProvisioningSection({ portalId, clientId, setup, provisioning }: Props) {
  const action = provisionWebsiteAction.bind(null, portalId, clientId, setup?.id ?? "");
  const [state, formAction] = useActionState(action, {});
  if (!setup || setup.status !== "CONFIRMED") return <SectionLocked title="Website Provisioning" icon={GitBranch} reason="Available once Build Setup is confirmed." />;
  const status = provisioning?.status ?? "NOT_STARTED";
  const targetOwner = provisioning?.targetOwner || setup.repositoryOwner || "GITHUB_DEFAULT_OWNER";
  return <div className="rounded-xl border border-border bg-card p-5">
    <h2 className="flex items-center gap-2 text-sm font-semibold"><GitBranch className="h-4 w-4 text-muted-foreground" />Website Provisioning</h2>
    <div className="mt-4 grid gap-4 rounded-lg bg-secondary/50 p-4 text-sm sm:grid-cols-3">
      <div><p className="text-xs text-muted-foreground">Source template</p><p className="break-all font-medium">{setup.sourceRepositoryUrl}</p></div>
      <div><p className="text-xs text-muted-foreground">Target repository</p><p className="font-medium">{targetOwner}/{setup.repositoryName}</p></div>
      <div><p className="text-xs text-muted-foreground">Visibility</p><p className="font-medium capitalize">{setup.repositoryVisibility.toLowerCase()}</p></div>
    </div>
    {status === "IN_PROGRESS" ? <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />GitHub provisioning is in progress. The action is disabled.</div> : null}
    {status === "FAILED" ? <div className="mt-4 rounded-lg border border-destructive/25 bg-destructive/5 p-3"><div className="flex items-center gap-2 text-sm font-medium text-destructive"><AlertTriangle className="h-4 w-4" />Provisioning failed</div><p className="mt-1 text-sm text-muted-foreground">{provisioning?.lastErrorMessage || "The repository could not be provisioned."}</p></div> : null}
    {status === "NEEDS_RECONCILIATION" ? <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-50 p-3 text-amber-900"><div className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4" />GitHub result needs inspection</div><p className="mt-1 text-sm">The create request may have succeeded. Inspect GitHub and reconcile this record before retrying; automatic retry is disabled.</p></div> : null}
    {status === "SUCCEEDED" ? <div className="mt-4 flex flex-wrap items-center gap-3"><Badge variant="secondary" className="bg-emerald-50 text-emerald-700"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Provisioned</Badge>{provisioning?.repositoryUrl ? <a className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline" href={provisioning.repositoryUrl} target="_blank" rel="noopener noreferrer">Open repository <ExternalLink className="h-3.5 w-3.5" /></a> : null}</div> : null}
    {(status === "NOT_STARTED" || status === "FAILED") ? <form action={formAction} className="mt-4"><Submit retry={status === "FAILED"} /></form> : null}
    <div aria-live="polite" className="mt-2">{state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}{state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}</div>
  </div>;
}
