export const HANDOFF_SECTION_FIELDS = {
  projectSummary: ["clientBusinessName", "projectName", "approvedDate", "paymentCompletionDate"],
  websiteLaunch: ["stagingUrl", "liveUrl", "launchDate", "status"],
  domain: ["primaryDomain", "registrar", "owner", "renewalResponsibility", "dnsManager", "transferAccessStatus"],
  hosting: ["siteName", "publicUrl", "owner", "billingResponsibility"],
  sourceCode: ["repositoryUrl", "owner", "visibility", "defaultBranch", "clientAccessStatus"],
  ownershipResponsibilities: ["clientOwns", "webDashyRetainsManages", "notes"],
  maintenanceSupport: ["clientCareDisposition", "planName", "supportEmail", "responseExpectation", "notes"],
  warranty: ["startDate", "endDate", "notes"],
  operationalResponsibilities: ["backups", "security", "updatesMonitoring", "offboardingNotes"],
  privacyDataCompliance: ["formsDataCollected", "analyticsCookies", "privacyPolicyResponsibility", "accessibilityResponsibility", "complianceNotes"],
};

export const HANDOFF_LAUNCH_STATUSES = ["PENDING_LAUNCH", "READY_TO_LAUNCH", "SCHEDULED", "LIVE_URL_RECORDED", "LAUNCHED"];
export const HANDOFF_VISIBILITIES = ["PRIVATE", "PUBLIC", "INTERNAL"];
export const HANDOFF_CARE_DISPOSITIONS = ["", "ENROLLED", "DECLINED", "INCLUDED", "NOT_APPLICABLE"];
export const HANDOFF_CHECKLIST_STATUSES = ["PENDING", "COMPLETED", "WAIVED", "NOT_APPLICABLE"];

const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" ? value : "";
const section = (value, fields) => {
  const source = record(value) ? value : value === null || value === undefined ? {} : { _legacyValue: value };
  return { ...source, ...Object.fromEntries(fields.map((key) => [key, text(source[key])])) };
};

export function normalizeHandoffDraft(value) {
  const source = record(value) ? value : {};
  const normalized = { ...source };
  for (const [name, fields] of Object.entries(HANDOFF_SECTION_FIELDS)) normalized[name] = section(source[name], fields);
  normalized.thirdPartyServices = Array.isArray(source.thirdPartyServices)
    ? source.thirdPartyServices.map((value) => {
      const row = record(value) ? value : { _legacyValue: value };
      return {
        ...row,
        service: text(row.service), purpose: text(row.purpose), accountOwner: text(row.accountOwner),
        billingOwner: text(row.billingOwner), dataHandled: text(row.dataHandled),
      };
    })
    : [];
  return normalized;
}

export function mergeHandoffDraft(current, edits) {
  const source = record(current) ? current : {};
  const result = { ...source };
  for (const [name, fields] of Object.entries(HANDOFF_SECTION_FIELDS)) {
    const currentSection = record(source[name]) ? source[name] : source[name] === null || source[name] === undefined ? {} : { _legacyValue: source[name] };
    const editSection = record(edits?.[name]) ? edits[name] : {};
    result[name] = { ...currentSection, ...Object.fromEntries(fields.filter((key) => Object.hasOwn(editSection, key)).map((key) => [key, text(editSection[key])])) };
  }
  const currentRows = Array.isArray(source.thirdPartyServices) ? source.thirdPartyServices : [];
  result.thirdPartyServices = Array.isArray(edits?.thirdPartyServices)
    ? edits.thirdPartyServices.map((row) => ({
        ...(Number.isInteger(row?.sourceIndex) && record(currentRows[row.sourceIndex]) ? currentRows[row.sourceIndex] : {}),
        service: text(row?.service), purpose: text(row?.purpose), accountOwner: text(row?.accountOwner),
        billingOwner: text(row?.billingOwner), dataHandled: text(row?.dataHandled),
      }))
    : [];
  return result;
}

export function toDateInputValue(value) {
  if (typeof value !== "string") return "";
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

export function hasSecretLookingKey(value) {
  if (Array.isArray(value)) return value.some(hasSecretLookingKey);
  if (!record(value)) return false;
  return Object.entries(value).some(([key, child]) =>
    /(password|passwd|secret|token|api.?key|private.?key|transfer.?code|credential)/i.test(key) || hasSecretLookingKey(child));
}

export function validateHandoffDraft(draft) {
  if (!record(draft)) throw new Error("Packet data must be an object.");
  if (hasSecretLookingKey(draft)) throw new Error("Secret-looking fields are not allowed in handoff data.");
  for (const name of Object.keys(HANDOFF_SECTION_FIELDS)) if (!record(draft[name])) throw new Error(`Invalid ${name} section.`);
  if (!Array.isArray(draft.thirdPartyServices)) throw new Error("Third-party services must be an array.");

  const allText = [];
  for (const [name, fields] of Object.entries(HANDOFF_SECTION_FIELDS)) {
    for (const key of fields) {
      const value = draft[name][key];
      if (typeof value !== "string") throw new Error(`${name}.${key} must be text.`);
      allText.push([`${name}.${key}`, value]);
    }
  }
  for (const [path, value] of allText) if (value.length > 5000) throw new Error(`${path} is too long.`);

  for (const path of [["websiteLaunch", "stagingUrl"], ["websiteLaunch", "liveUrl"], ["hosting", "publicUrl"], ["sourceCode", "repositoryUrl"]]) {
    const value = draft[path[0]][path[1]];
    if (!value) continue;
    try { const url = new URL(value); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); }
    catch { throw new Error(`Invalid URL: ${value}`); }
  }
  for (const [name, key] of [["projectSummary", "approvedDate"], ["projectSummary", "paymentCompletionDate"], ["websiteLaunch", "launchDate"], ["warranty", "startDate"], ["warranty", "endDate"]]) {
    const value = draft[name][key];
    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${name}.${key} must use YYYY-MM-DD.`);
    if (value) { const parsed = new Date(`${value}T00:00:00Z`); if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) throw new Error(`${name}.${key} is not a valid date.`); }
  }
  if (!HANDOFF_LAUNCH_STATUSES.includes(draft.websiteLaunch.status)) throw new Error("Invalid launch status.");
  if (draft.sourceCode.visibility && !HANDOFF_VISIBILITIES.includes(draft.sourceCode.visibility)) throw new Error("Invalid repository visibility.");
  if (!HANDOFF_CARE_DISPOSITIONS.includes(draft.maintenanceSupport.clientCareDisposition)) throw new Error("Invalid Client Care disposition.");
  const supportEmail = draft.maintenanceSupport.supportEmail;
  if (supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) throw new Error("Invalid support email.");

  draft.thirdPartyServices.forEach((row, index) => {
    if (!record(row)) throw new Error(`Third-party service ${index + 1} is invalid.`);
    for (const key of ["service", "purpose", "accountOwner", "billingOwner", "dataHandled"]) {
      if (typeof row[key] !== "string") throw new Error(`Third-party service ${index + 1} ${key} must be text.`);
      if (row[key].length > 1000) throw new Error(`Third-party service ${index + 1} ${key} is too long.`);
    }
    if (hasSecretLookingKey(row)) throw new Error("Secret-looking fields are not allowed in third-party services.");
  });
  return draft;
}

export function assertDraftEditable(status) {
  if (status !== "DRAFT") throw new Error("Issued packets are immutable.");
}

export function validateChecklistSubmission(value, ownedIds) {
  if (!Array.isArray(value) || value.some((item) => !record(item) || typeof item.id !== "string" || typeof item.status !== "string" || typeof item.note !== "string" || item.note.length > 2000)) throw new Error("Invalid checklist data.");
  if (new Set(value.map((item) => item.id)).size !== value.length) throw new Error("Duplicate checklist item.");
  if (value.some((item) => !ownedIds.has(item.id))) throw new Error("Invalid checklist item.");
  if (value.some((item) => !HANDOFF_CHECKLIST_STATUSES.includes(item.status))) throw new Error("Invalid checklist status.");
  return value;
}

export function resolveChecklistDefaults(items, facts) {
  const services = Array.isArray(facts.thirdPartyServices) ? facts.thirdPartyServices : [];
  const serviceText = services.map((row) => record(row) ? `${text(row.service)} ${text(row.purpose)}`.toLowerCase() : "").join(" ");
  const analyticsRecorded = Boolean(text(facts.analyticsCookies).trim()) || /(analytics|tag manager|pixel|matomo|plausible)/.test(serviceText);
  const formsEmailRecorded = /(form|email|mail|newsletter|crm)/.test(serviceText);
  const automatic = {
    final_live_url: facts.liveUrl ? "COMPLETED" : null,
    third_party_services: services.length === 0 ? "NOT_APPLICABLE" : null,
    analytics_access: analyticsRecorded ? null : "NOT_APPLICABLE",
    forms_email_access: formsEmailRecorded ? null : "NOT_APPLICABLE",
  };
  return items.map((item) => item.status === "PENDING" && automatic[item.key] ? { ...item, status: automatic[item.key] } : item);
}

export function guidedHandoffCompletion(draft, checklist) {
  const normalized = normalizeHandoffDraft(draft), items = Array.isArray(checklist) ? checklist : [];
  const unresolvedOwnership = items.some((item) => record(item) && item.required && ["domain_access", "domain_ownership", "github_access", "netlify_access"].includes(item.key) && item.status === "PENDING");
  const launch = Boolean(normalized.websiteLaunch.liveUrl.trim()) && Boolean(normalized.websiteLaunch.status) && normalized.websiteLaunch.status !== "PENDING_LAUNCH";
  const ownership = [normalized.domain.owner, normalized.domain.registrar, normalized.domain.renewalResponsibility, normalized.domain.dnsManager, normalized.domain.transferAccessStatus].every((value) => value.trim()) && normalized.domain.transferAccessStatus !== "PENDING" && !unresolvedOwnership;
  const care = Boolean(normalized.maintenanceSupport.clientCareDisposition);
  return [launch, ownership, care, false];
}
