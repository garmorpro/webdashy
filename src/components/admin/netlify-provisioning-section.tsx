"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, CheckCircle2, Cloud, ExternalLink, LoaderCircle } from "lucide-react";
import type { BuildSetup, NetlifyProvisioning, WebsiteProvisioning } from "@prisma/client";
import { provisionNetlifyAction, reconcileNetlifyAction } from "@/lib/actions/netlify-provisioning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionLocked } from "@/components/admin/section-locked";

type Props = { portalId: string; clientId: string; setup: BuildSetup | null; website: WebsiteProvisioning | null; provisioning: NetlifyProvisioning | null };
function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) { const { pending } = useFormStatus(); return <Button type="submit" disabled={pending}>{pending ? <><LoaderCircle className="h-4 w-4 animate-spin" />{pendingLabel}</> : label}</Button>; }

export function NetlifyProvisioningSection({ portalId, clientId, setup, website, provisioning }: Props) {
  const provision = useActionState(provisionNetlifyAction.bind(null, portalId, clientId, website?.id ?? ""), {});
  const reconcile = useActionState(reconcileNetlifyAction.bind(null, portalId, clientId, provisioning?.id ?? ""), {});
  if (!setup || website?.status !== "SUCCEEDED") return <SectionLocked title="Netlify Provisioning" icon={Cloud} reason="Waiting for GitHub Website Provisioning to succeed." />;
  const status = provisioning?.status ?? "NOT_STARTED";
  const target = provisioning?.siteName || setup.siteSlug;
  const shouldCheck = status === "DEPLOYING" || (status === "FAILED" && Boolean(provisioning?.netlifySiteId));
  const state = shouldCheck ? reconcile[0] : provision[0];
  return <div className="rounded-xl border border-border bg-card p-5">
    <h2 className="flex items-center gap-2 text-sm font-semibold"><Cloud className="h-4 w-4 text-muted-foreground" />Netlify Provisioning</h2>
    <div className="mt-4 grid gap-4 rounded-lg bg-secondary/50 p-4 text-sm sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Target site name</p><p className="font-medium">{target}</p></div><div><p className="text-xs text-muted-foreground">GitHub repository</p><p className="font-medium">{website.targetOwner}/{website.targetRepositoryName} · {website.defaultBranch}</p></div></div>
    {status === "NOT_STARTED" && website.actualVisibility !== "PUBLIC" ? <div className="mt-4 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">This Netlify Free workflow supports public GitHub repositories only.</div> : null}
    {status === "IN_PROGRESS" ? <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />Creating the Netlify project…</p> : null}
    {status === "DEPLOYING" ? <div className="mt-4"><p className="text-sm text-muted-foreground">Initial production deploy: <span className="font-medium text-foreground">{provisioning?.initialDeployState || "pending"}</span></p><form action={reconcile[1]} className="mt-3"><Submit label="Check Deployment" pendingLabel="Checking…" /></form></div> : null}
    {status === "FAILED" ? <div className="mt-4"><div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3"><p className="flex items-center gap-2 text-sm font-medium text-destructive"><AlertTriangle className="h-4 w-4" />Netlify provisioning failed</p><p className="mt-1 text-sm text-muted-foreground">{provisioning?.lastErrorMessage || "Netlify could not be provisioned."}</p></div><form action={shouldCheck ? reconcile[1] : provision[1]} className="mt-3"><Submit label={shouldCheck ? "Check Deployment" : "Retry"} pendingLabel={shouldCheck ? "Checking…" : "Retrying…"} /></form></div> : null}
    {status === "NEEDS_RECONCILIATION" ? <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-50 p-3 text-amber-900"><p className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4" />Manual inspection required</p><p className="mt-1 text-sm">The create request may have succeeded. Inspect the Netlify team before reconciling; automatic creation is disabled to prevent a duplicate site.</p></div> : null}
    {status === "SUCCEEDED" ? <div className="mt-4 space-y-2"><Badge variant="secondary" className="bg-emerald-50 text-emerald-700"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Deployed</Badge><div className="flex flex-wrap gap-3 text-sm">{provisioning?.sslUrl ? <a className="inline-flex items-center gap-1 font-medium text-primary hover:underline" href={provisioning.sslUrl} target="_blank" rel="noopener noreferrer">Open staging site <ExternalLink className="h-3.5 w-3.5" /></a> : null}{provisioning?.adminUrl ? <a className="inline-flex items-center gap-1 font-medium text-primary hover:underline" href={provisioning.adminUrl} target="_blank" rel="noopener noreferrer">Open Netlify <ExternalLink className="h-3.5 w-3.5" /></a> : null}</div>{provisioning?.netlifySiteId ? <p className="text-xs text-muted-foreground">Site ID: {provisioning.netlifySiteId}</p> : null}</div> : null}
    {status === "NOT_STARTED" ? <form action={provision[1]} className="mt-4"><Submit label="Provision Netlify" pendingLabel="Provisioning…" /></form> : null}
    <div aria-live="polite" className="mt-2">{state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}{state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}</div>
  </div>;
}
