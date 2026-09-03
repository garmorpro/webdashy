const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export function safeFilenamePart(value, fallback = "Client") {
  const cleaned = String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  return cleaned || fallback;
}

export function isRevision3Agreement(snapshot) {
  return Number(snapshot?.snapshotSchemaVersion) === 3;
}

export function handoffAgreementFilename(snapshot, signed = false) {
  const project = record(snapshot?.draftData?.projectSummary) ? snapshot.draftData.projectSummary : {};
  const clientName = project.clientBusinessName ?? snapshot?.recipient?.name;
  return `WebDashy-${signed ? "Signed-" : ""}Client-Agreement-${safeFilenamePart(clientName)}.pdf`;
}

export function handoffDocumentUnits(snapshot) {
  const modules = Array.isArray(snapshot?.policyModules) ? snapshot.policyModules.filter(record) : null;
  if (!modules) return [{ key: "legacy-packet", title: "Project Handoff", filename: "01-Project-Handoff.pdf", legacy: true }];
  if (isRevision3Agreement(snapshot)) {
    const agreement = modules.find((module) => module.key === "client_agreement");
    return agreement ? [{ key: "client_agreement", title: "Client Agreement", filename: handoffAgreementFilename(snapshot), module: agreement, legacy: false }] : [];
  }
  return modules.map((module, index) => ({
    key: String(module.key ?? `document-${index + 1}`),
    title: String(module.title ?? `Document ${index + 1}`),
    filename: `${String(index + 1).padStart(2, "0")}-${safeFilenamePart(module.title, `Document-${index + 1}`)}.pdf`,
    module,
    legacy: false,
  }));
}

export function handoffArchiveFilename(snapshot) {
  const project = record(snapshot?.draftData?.projectSummary) ? snapshot.draftData.projectSummary : {};
  const clientName = project.clientBusinessName ?? snapshot?.recipient?.name;
  return `WebDashy-Handoff-${safeFilenamePart(clientName)}-v${Number(snapshot?.packet?.version) || 1}.zip`;
}
