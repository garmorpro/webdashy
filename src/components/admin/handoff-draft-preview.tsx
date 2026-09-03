"use client";

type Module = { key: string; title: string; description: string; subtitle?: string; required?: boolean };

export function HandoffDraftPreview({ clientId, revisionId, revision, modules, previewDocumentKeys, initialSelected, recommendations }: { clientId:string;revisionId:string;revision:number;modules:Module[];previewDocumentKeys:string[];initialSelected:string[];recommendations:{recommended:string[];conditional:string[];optional:string[]} }) {
  const revision3 = revision === 3;
  // Revision 3's required document belongs to the template, not to the legacy
  // recommendation/selection model. It must remain visible even if those lists
  // do not contain it.
  const visible = revision3
    ? modules.filter((module) => module.required)
    : modules.filter((module) => recommendations.recommended.includes(module.key) || initialSelected.includes(module.key));
  const missingRequiredPreview = revision3 && visible.length > 0 && !visible.some((module) => previewDocumentKeys.includes(module.key));

  return <div className="space-y-4"><div><h2 className="text-lg font-bold">Recommended Handoff</h2>{revision3?<p className="text-sm text-muted-foreground">Revision 3 contains one required agreement tailored to this client and project.</p>:null}</div>{missingRequiredPreview?<p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm font-medium text-destructive">Revision 3 contains a required Client Agreement, but no preview document was generated.</p>:null}<div className="grid gap-3">{visible.map((module)=>{const previewHref=`/api/handoff-preview/${clientId}/documents/${encodeURIComponent(module.key)}?revisionId=${encodeURIComponent(revisionId)}`;return <div key={module.key} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4"><span className="min-w-0 flex-1"><span className="text-[10px] font-bold uppercase tracking-wide text-primary">{module.required?"Required · Recommended":"Recommended"}</span><span className="block font-medium">✓ {module.title}</span><span className="mt-1 block text-xs text-muted-foreground">{module.subtitle ?? module.description}</span></span><span className="flex shrink-0 flex-wrap gap-3"><a className="text-sm font-medium text-primary underline" href={previewHref} target="_blank" rel="noopener noreferrer">{revision3?"Preview Agreement PDF":"Preview PDF"}</a>{revision3?<a className="text-sm font-medium text-primary underline" href={`${previewHref}&download=1`}>Download Preview PDF</a>:null}</span></div>})}</div></div>;
}
