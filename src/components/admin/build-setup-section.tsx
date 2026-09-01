"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Hammer, Pencil } from "lucide-react";
import type { BuildSetup } from "@prisma/client";
import { generateBuildSetup, saveBuildSetup } from "@/lib/actions/build-setup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionLocked } from "@/components/admin/section-locked";

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function text(value: unknown) { return typeof value === "string" ? value : ""; }
function names(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => text(object(item).name)).filter(Boolean) : [];
}
function ActionButtons({ confirmed, state }: { confirmed: boolean; state: { error?: string; success?: string } }) {
  const { data, pending } = useFormStatus();
  const intent = data?.get("intent");
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="intent" value="save" disabled={pending}>{pending && intent === "save" ? "Saving..." : confirmed ? "Save as Draft" : "Save Draft"}</Button>
        <Button type="submit" name="intent" value="confirm" variant="outline" disabled={pending}>{pending && intent === "confirm" ? "Confirming..." : "Confirm Build Setup"}</Button>
      </div>
      <div aria-live="polite">
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      </div>
    </div>
  );
}
function Field({ label, name, value, type = "text", required = false }: { label: string; name: string; value: string; type?: string; required?: boolean }) {
  return <div className="space-y-1.5"><Label htmlFor={`build-${name}`}>{label}</Label><Input id={`build-${name}`} name={name} type={type} defaultValue={value} required={required} /></div>;
}
function Area({ label, name, value, rows = 3, hint, required = false }: { label: string; name: string; value: string; rows?: number; hint?: string; required?: boolean }) {
  return <div className="space-y-1.5"><Label htmlFor={`build-${name}`}>{label}</Label><Textarea id={`build-${name}`} name={name} defaultValue={value} rows={rows} required={required} />{hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}</div>;
}
function Heading({ children }: { children: React.ReactNode }) { return <h3 className="border-b border-border pb-2 text-sm font-bold text-foreground">{children}</h3>; }

export function BuildSetupSection({ portalId, clientId, setup, locked }: { portalId: string; clientId: string; setup: BuildSetup | null; locked: boolean }) {
  const generate = generateBuildSetup.bind(null, portalId, clientId);
  const [generateState, generateAction, generating] = useActionState(generate, {});
  const [editing, setEditing] = useState(setup?.status !== "CONFIRMED");
  const save = setup ? saveBuildSetup.bind(null, setup.id, portalId, clientId) : null;
  const saveAndUpdateEditing = async (...args: Parameters<NonNullable<typeof save>>) => {
    if (!save) return { error: "Build Setup unavailable." };
    const result = await save(...args);
    if (result.confirmed) setEditing(false);
    return result;
  };
  const [saveState, saveAction] = useActionState(saveAndUpdateEditing, {});

  if (locked) return <SectionLocked title="Build Setup" icon={Hammer} reason="Available once Template & Plan are selected and Project Requirements are saved." />;
  if (!setup) return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="flex items-center gap-2 text-sm font-semibold"><Hammer className="h-4 w-4 text-muted-foreground" />Build Setup</h2><p className="mt-1 text-xs text-muted-foreground">Combine the questionnaire, selected foundation, and agreed requirements into an editable build contract.</p></div><form action={generateAction}><Button type="submit" size="sm" disabled={generating}>{generating ? "Generating..." : "Generate Build Setup"}</Button></form></div>
      {generateState.error ? <p className="mt-3 text-sm text-destructive">{generateState.error}</p> : null}
    </div>
  );

  const business = object(setup.businessProfile), content = object(setup.contentBrief), design = object(setup.designBrief);
  const pageNames = names(setup.pages), featureNames = names(setup.features);
  if (setup.status === "CONFIRMED" && !editing) return (
    <div className="rounded-xl border border-emerald-500/30 bg-card p-5">
      <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Build Setup Confirmed</h2><Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" />Edit Build Setup</Button></div>
      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs text-muted-foreground">Project</p><p className="font-medium">{setup.projectName}</p><p className="text-muted-foreground">/{setup.siteSlug}</p></div><div><p className="text-xs text-muted-foreground">Repository</p><p className="font-medium">{setup.repositoryOwner ? `${setup.repositoryOwner}/` : ""}{setup.repositoryName}</p><p className="text-muted-foreground">{setup.repositoryVisibility.toLowerCase()}</p></div><div><p className="text-xs text-muted-foreground">Foundation</p><p className="font-medium">{setup.templateNameSnapshot}</p><p className="text-muted-foreground">{setup.planNameSnapshot ?? "No plan snapshot"}</p></div><div><p className="text-xs text-muted-foreground">Scope</p><p className="font-medium">{pageNames.length} pages · {featureNames.length} features</p><p className="text-muted-foreground">Confirmed {setup.confirmedAt ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(setup.confirmedAt) : ""}</p></div></div>
    </div>
  );

  return (
    <form action={saveAction} className="space-y-6 rounded-xl border border-primary bg-card p-5 shadow-[0_0_0_3px_rgba(164,255,79,0.18)]">
      <div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-sm font-semibold"><Hammer className="h-4 w-4 text-muted-foreground" />Build Setup {setup.status === "CONFIRMED" ? "Edit" : "Draft"}</h2><p className="mt-1 text-xs text-muted-foreground">Review uncertain suggestions before confirming. Editing a confirmed setup saves it back as a draft.</p></div>{setup.status === "CONFIRMED" ? <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button> : null}</div>
      {saveState.error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{saveState.error}</div> : null}
      <section className="space-y-4"><Heading>A. Project</Heading><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Project / site name" name="projectName" value={setup.projectName} required /><Field label="Site slug" name="siteSlug" value={setup.siteSlug} required /><Field label="Repository name" name="repositoryName" value={setup.repositoryName} required /><Field label="Repository owner" name="repositoryOwner" value={setup.repositoryOwner ?? ""} /><div className="space-y-1.5"><Label htmlFor="build-visibility">Visibility</Label><select id="build-visibility" name="repositoryVisibility" defaultValue={setup.repositoryVisibility} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"><option value="PRIVATE">Private</option><option value="PUBLIC">Public</option></select></div><Field label="Source ref / branch" name="sourceRef" value={setup.sourceRef ?? ""} /><Field label="Primary domain" name="primaryDomain" value={setup.primaryDomain ?? ""} /><Field label="Existing website" name="existingWebsiteUrl" value={setup.existingWebsiteUrl ?? ""} /></div></section>
      <section className="space-y-4"><Heading>B. Foundation</Heading><div className="grid gap-4 sm:grid-cols-2"><Field label="Selected template" name="templateSnapshot" value={`${setup.templateNameSnapshot} (${setup.templateSlugSnapshot})`} /><Field label="Template repository URL" name="sourceRepositoryUrl" value={setup.sourceRepositoryUrl} required /><Field label="Selected plan" name="planSnapshot" value={setup.planNameSnapshot ?? "Not selected"} /><Area label="Included plan features" name="planFeaturesSnapshot" value={setup.planFeaturesSnapshot.join("\n")} rows={4} hint="Snapshot shown for reference; edit the plan catalog to change its commercial definition." /></div></section>
      <section className="space-y-4"><Heading>C. Public business information</Heading><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Business name" name="businessName" value={text(business.businessName)} /><Field label="Address" name="address" value={text(business.address)} /><Field label="Phone" name="publicPhone" value={text(business.phone)} /><Field label="Email" name="publicEmail" value={text(business.email)} /><Field label="Hours" name="hours" value={text(business.hours)} /><Field label="Service areas" name="serviceAreas" value={text(business.serviceAreas)} /></div></section>
      <section className="space-y-4"><Heading>D. Pages</Heading><Area label="Page list" name="pages" value={pageNames.join("\n")} rows={6} hint="One page per line. Saving makes the listed scope admin-confirmed." required /></section>
      <section className="space-y-4"><Heading>E. Features</Heading><Area label="Feature list" name="features" value={featureNames.join("\n")} rows={5} hint="One feature per line. These start from confirmed Project Requirements." /></section>
      <section className="space-y-4"><Heading>F. Content & Design Brief</Heading><div className="grid gap-4 sm:grid-cols-2"><Area label="Business story" name="story" value={text(content.story)} /><Area label="Priority services" name="services" value={text(content.services)} /><Area label="Audience" name="audience" value={text(content.audience)} /><Area label="Key information" name="keyInformation" value={text(content.keyInformation)} /><Area label="Calls to action" name="callsToAction" value={text(content.callsToAction)} /><Area label="Ongoing updates" name="updates" value={text(content.updates)} /><Area label="Other content direction" name="contentOther" value={text(content.other)} /><Area label="Aesthetic" name="aesthetic" value={text(design.aesthetic)} /><Area label="Existing branding" name="branding" value={text(design.branding)} /><Area label="Reference websites" name="references" value={text(design.references)} /><Area label="Competitors" name="competitors" value={text(design.competitors)} /><Area label="Other design direction" name="designOther" value={text(design.other)} /></div></section>
      <section className="space-y-4"><Heading>G. Schedule & Notes</Heading><div className="grid gap-4 sm:grid-cols-2"><Field label="Target launch date" name="targetLaunchDate" type="date" value={setup.targetLaunchDate?.toISOString().slice(0, 10) ?? ""} /><Area label="Notes" name="notes" value={setup.notes ?? ""} /><Area label="Unresolved items" name="unresolvedItems" value={setup.unresolvedItems.join("\n")} rows={5} hint="One item per line. Confirmation is allowed after the required contract fields are complete; keep non-blocking follow-ups visible here." /></div></section>
      <ActionButtons confirmed={setup.status === "CONFIRMED"} state={saveState} />
    </form>
  );
}
