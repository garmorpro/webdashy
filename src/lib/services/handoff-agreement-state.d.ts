export type Revision3AgreementState = { key:string; label:string };
export function revision3AgreementState(input:{ status:string; acceptance:unknown; firstSentAt:string|null; emailAttempts?:{status:string}[] }):Revision3AgreementState;
