export const CURRENT_HANDOFF_SNAPSHOT_SCHEMA_VERSION = 3;
export const SUPPORTED_HANDOFF_SNAPSHOT_SCHEMA_VERSIONS = new Set([1, 2, 3]);

const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const issue = (schemaPath, schemaIssue) => ({ valid: false, schemaPath, schemaIssue });
const valid = Object.freeze({ valid: true, schemaPath: null, schemaIssue: null });

export function canonicalSnapshotSchemaVersion(templateSchemaVersion) {
  if (!SUPPORTED_HANDOFF_SNAPSHOT_SCHEMA_VERSIONS.has(templateSchemaVersion)) throw new Error(`Unsupported handoff snapshot schema version: ${templateSchemaVersion}`);
  return templateSchemaVersion;
}

export function snapshotSchemaVersionProblem(persistedVersion, snapshot) {
  const snapshotVersion = snapshot?.snapshotSchemaVersion;
  if (persistedVersion !== snapshotVersion) return "SNAPSHOT_SCHEMA_VERSION_MISMATCH";
  if (!SUPPORTED_HANDOFF_SNAPSHOT_SCHEMA_VERSIONS.has(persistedVersion)) return "SNAPSHOT_SCHEMA_VERSION_UNSUPPORTED";
  return null;
}

function validateAgreementModule(module, path) {
  if (!record(module)) return issue(path, "client_agreement module must be an object");
  if (module.key !== "client_agreement") return issue(`${path}.key`, "Revision 3 contains only client_agreement");
  for (const field of ["title", "subtitle"]) if (typeof module[field] !== "string" || !module[field].trim()) return issue(`${path}.${field}`, `client_agreement ${field} is required`);
  if (module.required !== true) return issue(`${path}.required`, "client_agreement must be required");
  if (typeof module.legalReviewRequired !== "boolean") return issue(`${path}.legalReviewRequired`, "client_agreement legal review metadata is required");
  if (typeof module.contentStrategy !== "string" || !module.contentStrategy.trim()) return issue(`${path}.contentStrategy`, "client_agreement content strategy is required");
  if (!Array.isArray(module.sections) || module.sections.length === 0) return issue(`${path}.sections`, "client_agreement module is missing required structured content");
  for (let index = 0; index < module.sections.length; index += 1) {
    const section = module.sections[index], sectionPath = `${path}.sections[${index}]`;
    if (!record(section)) return issue(sectionPath, "agreement section must be an object");
    if (typeof section.heading !== "string" || !/^\d+\.\s+\S/.test(section.heading)) return issue(`${sectionPath}.heading`, "agreement section must have a numbered heading");
    if (!["paragraphs", "bullets", "facts"].some((field) => Array.isArray(section[field]) && section[field].length > 0)) return issue(sectionPath, "agreement section must contain paragraphs, bullets, or facts");
  }
  return valid;
}

export function validateRevision3Snapshot(snapshot) {
  if (!record(snapshot)) return issue("snapshot", "snapshot must be an object");
  if (snapshot.snapshotSchemaVersion !== 3) return issue("snapshotSchemaVersion", "Revision 3 snapshot must declare schema version 3");
  if (!record(snapshot.packet)) return issue("packet", "packet metadata is required");
  if (typeof snapshot.packet.id !== "string" || !snapshot.packet.id) return issue("packet.id", "packet id is required");
  if (!Number.isInteger(snapshot.packet.version) || snapshot.packet.version < 1) return issue("packet.version", "packet version must be a positive integer");
  if (typeof snapshot.issuedAt !== "string" || Number.isNaN(Date.parse(snapshot.issuedAt))) return issue("issuedAt", "issuance timestamp is required");
  if (!record(snapshot.template)) return issue("template", "template revision metadata is required");
  if (snapshot.template.schemaVersion !== 3) return issue("template.schemaVersion", "template schema version must be 3");
  for (const field of ["id", "slug", "revisionId"]) if (typeof snapshot.template[field] !== "string" || !snapshot.template[field]) return issue(`template.${field}`, `template ${field} is required`);
  if (!Number.isInteger(snapshot.template.revision) || snapshot.template.revision < 1) return issue("template.revision", "template revision must be a positive integer");
  if (!record(snapshot.recipient)) return issue("recipient", "recipient is required");
  if (typeof snapshot.recipient.name !== "string" || !snapshot.recipient.name.trim()) return issue("recipient.name", "recipient name is required");
  if (typeof snapshot.recipient.email !== "string" || !snapshot.recipient.email.trim()) return issue("recipient.email", "recipient email is required");
  if (!record(snapshot.draftData)) return issue("draftData", "frozen handoff details are required");
  if (!record(snapshot.draftData.projectSummary)) return issue("draftData.projectSummary", "frozen project summary is required");
  if (!record(snapshot.handoffFacts)) return issue("handoffFacts", "normalized handoff facts are required");
  if (!Number.isInteger(snapshot.handoffFacts.factModelVersion)) return issue("handoffFacts.factModelVersion", "normalized fact model version is required");
  if (typeof snapshot.acceptanceText !== "string" || !/\bAgreement\b/.test(snapshot.acceptanceText)) return issue("acceptanceText", "immutable Client Agreement acceptance text is required");
  for (const field of ["sections", "policyModules"]) {
    if (!Array.isArray(snapshot[field]) || snapshot[field].length !== 1) return issue(field, "Revision 3 must contain exactly one client_agreement module");
    const moduleIssue = validateAgreementModule(snapshot[field][0], `${field}[0]`);
    if (!moduleIssue.valid) return moduleIssue;
  }
  return valid;
}

// Packet v7 exposed this pre-normalization issuer defect. selectedPolicyKeys is
// draft provenance, not the authoritative frozen document list.
export function revision3LegacySelectionIssue(snapshot) {
  if (snapshot?.snapshotSchemaVersion !== 3 || !Array.isArray(snapshot?.draftData?.selectedPolicyKeys)) return null;
  const index = snapshot.draftData.selectedPolicyKeys.findIndex((key) => key !== "client_agreement");
  return index < 0 ? null : issue(`draftData.selectedPolicyKeys[${index}]`, "legacy document selection was frozen before Revision 3 normalization");
}

export function validateSnapshotShape(snapshot) {
  if (!record(snapshot)) return issue("snapshot", "snapshot must be an object");
  if (!snapshot.packet) return issue("packet", "packet metadata is required");
  if (typeof snapshot.acceptanceText !== "string") return issue("acceptanceText", "acceptance text is required");
  if (!snapshot.draftData) return issue("draftData", "draft data is required");
  if (snapshot.snapshotSchemaVersion === 1) return Array.isArray(snapshot.checklist) || Array.isArray(snapshot.policyModules) ? valid : issue("checklist", "Revision 1 requires checklist or policy modules");
  if (snapshot.snapshotSchemaVersion === 2) return Array.isArray(snapshot.policyModules) ? valid : issue("policyModules", "Revision 2 requires policy modules");
  if (snapshot.snapshotSchemaVersion === CURRENT_HANDOFF_SNAPSHOT_SCHEMA_VERSION) return validateRevision3Snapshot(snapshot);
  return issue("snapshotSchemaVersion", "snapshot schema version is unsupported");
}

export function isSnapshotShapeValid(snapshot) { return validateSnapshotShape(snapshot).valid; }
