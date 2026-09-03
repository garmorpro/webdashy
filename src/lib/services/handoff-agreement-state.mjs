/**
 * @param {{status:string, acceptance:unknown, firstSentAt:string|null, emailAttempts?:Array<{status:string}>}} input
 */
export function revision3AgreementState({ status, acceptance, firstSentAt, emailAttempts = [] }) {
  const latestAttempt = emailAttempts[0];
  if (latestAttempt?.status === "FAILED") return { key: "DELIVERY_FAILED", label: "Delivery Failed" };
  if (status === "COMPLETED") return { key: "COMPLETED", label: "Completed" };
  if (acceptance || status === "ACCEPTED") return { key: "SIGNED", label: "Signed" };
  if (status === "SENT" || status === "VIEWED" || firstSentAt) return { key: "AWAITING_SIGNATURE", label: "Awaiting Signature" };
  if (status === "ISSUED") return { key: "ISSUED", label: "Issued" };
  return { key: "DRAFT", label: "Draft Agreement" };
}
