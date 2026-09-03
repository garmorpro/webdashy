"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { acceptHandoffAction, type PublicHandoffState } from "@/lib/actions/public-handoff";

function Submit() { const { pending } = useFormStatus(); return <button disabled={pending} className="rounded-lg bg-[#1b2951] px-5 py-3 font-semibold text-white disabled:opacity-60">{pending ? "Accepting…" : "Accept Agreement"}</button>; }

export function AcceptanceForm({ token, acknowledgmentText, submissionKey, clientBusinessName, requireTitle = false }: { token: string; acknowledgmentText: string; submissionKey: string; clientBusinessName: string; requireTitle?: boolean }) {
  const action = acceptHandoffAction.bind(null, token); const [state, formAction] = useActionState<PublicHandoffState, FormData>(action, {});
  const [typedName, setTypedName] = useState("");
  if (state.accepted) return <div className="rounded-xl bg-emerald-50 p-5 text-emerald-900"><strong>Agreement accepted.</strong> Your accepted PDF is now available above.</div>;
  return <form action={formAction} className="space-y-5">
    <input type="hidden" name="submissionKey" value={submissionKey}/>
    <label className="block text-sm font-semibold">Full Legal Name<input required name="typedName" minLength={2} maxLength={200} autoComplete="name" value={typedName} onChange={(event)=>setTypedName(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-300 p-3 font-normal"/></label>
    <label className="block text-sm font-semibold">Title / Role<input required={requireTitle} name="signerTitle" maxLength={200} autoComplete="organization-title" placeholder="Owner, President, Managing Member…" className="mt-2 block w-full rounded-lg border border-slate-300 p-3 font-normal"/></label>
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4" aria-live="polite"><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Signature Preview</p><p data-testid="signature-preview" className="mt-3 min-h-12 break-words text-3xl italic leading-tight text-[#172554] [font-family:'Segoe_Script','Bradley_Hand','Brush_Script_MT','URW_Chancery_L',cursive]">{typedName.trim() || "Your name will appear here"}</p><p className="mt-2 text-xs text-slate-500">Your typed legal name is the signature record. This styling is for presentation only.</p></div>
    <div className="space-y-3 border-t border-slate-200 pt-5">
      <label className="flex gap-3 text-sm leading-6"><input required type="checkbox" name="authorityConfirmed" className="mt-1 h-4 w-4 shrink-0"/> <span>I confirm that I am authorized to accept this Agreement on behalf of {clientBusinessName}.</span></label>
      <label className="flex gap-3 text-sm leading-6"><input required type="checkbox" name="acknowledgmentConfirmed" className="mt-1 h-4 w-4 shrink-0"/> <span>I have reviewed and agree to the Client Agreement.</span></label>
    </div>
    <details className="text-xs text-slate-500"><summary className="cursor-pointer">Electronic acceptance record</summary><p className="mt-2 whitespace-pre-wrap leading-5">{acknowledgmentText}</p></details>
    {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}<Submit/>
  </form>;
}
