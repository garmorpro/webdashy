export function canBeginProvisioning(status) {
  return status === "NOT_STARTED" || status === "FAILED";
}
