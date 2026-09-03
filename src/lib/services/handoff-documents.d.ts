import type { HandoffPolicyModule, HandoffSnapshot } from "./public-handoff";
export type HandoffDocumentUnit = { key:string; title:string; filename:string; legacy:boolean; module?:HandoffPolicyModule };
export function safeFilenamePart(value:unknown,fallback?:string):string;
export function isRevision3Agreement(snapshot:unknown):boolean;
export function handoffAgreementFilename(snapshot:unknown,signed?:boolean):string;
export function handoffDocumentUnits(snapshot:unknown):HandoffDocumentUnit[];
export function handoffArchiveFilename(snapshot:HandoffSnapshot):string;
