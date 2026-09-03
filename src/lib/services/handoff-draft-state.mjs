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

const HANDOFF_DATE_FIELDS = new Set([
  "projectSummary.approvedDate",
  "projectSummary.paymentCompletionDate",
  "websiteLaunch.launchDate",
  "warranty.startDate",
  "warranty.endDate",
]);
import { normalizeSelectedPolicyKeys } from "./handoff-policy-modules.mjs";

const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" ? value : "";
const validCalendarDate = (value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
};
export function normalizeHandoffDate(value) {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !validCalendarDate(value.slice(0, 10))) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? value : parsed.toISOString().slice(0, 10);
}

const section = (name, value, fields) => {
  const source = record(value) ? value : value === null || value === undefined ? {} : { _legacyValue: value };
  return {
    ...source,
    ...Object.fromEntries(fields.map((key) => {
      const path = `${name}.${key}`;
      return [key, HANDOFF_DATE_FIELDS.has(path) ? normalizeHandoffDate(source[key]) : text(source[key])];
    })),
  };
};

export function normalizeHandoffDraft(value) {
  const source = record(value) ? value : {};
  const normalized = { ...source };
  for (const [name, fields] of Object.entries(HANDOFF_SECTION_FIELDS)) normalized[name] = section(name, source[name], fields);
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
  normalized.selectedPolicyKeys = normalizeSelectedPolicyKeys(source.selectedPolicyKeys);
  normalized.adminNote = text(source.adminNote);
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
  if (record(edits) && Object.hasOwn(edits, "selectedPolicyKeys")) result.selectedPolicyKeys = normalizeSelectedPolicyKeys(edits.selectedPolicyKeys);
  if (record(edits) && Object.hasOwn(edits, "adminNote")) result.adminNote = text(edits.adminNote);
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
  draft.selectedPolicyKeys = normalizeSelectedPolicyKeys(draft.selectedPolicyKeys);
  if (typeof draft.adminNote !== "string" || draft.adminNote.length > 5000) throw new Error("Admin note must be text under 5000 characters.");

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
    if (value && !validCalendarDate(value)) throw new Error(`${name}.${key} is not a valid date.`);
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

function validateOptionalText(value, label, maxLength = 5000) {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string" || value.length > maxLength) throw new Error(`${label} must be text under ${maxLength} characters.`);
  return value;
}

function validateDate(value, path) {
  if (!value) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${path} must use YYYY-MM-DD.`);
  if (!validCalendarDate(value)) throw new Error(`${path} is not a valid date.`);
}

export function validateHandoffWizardStep(draft, step) {
  if (!record(draft)) throw new Error("Packet data must be an object.");
  if (hasSecretLookingKey(draft)) throw new Error("Secret-looking fields are not allowed in handoff data.");
  if (step === 1) {
    if (!Array.isArray(draft.selectedPolicyKeys) || draft.selectedPolicyKeys.some((key) => typeof key !== "string")) throw new Error("Selected packet documents are invalid.");
    draft.selectedPolicyKeys = normalizeSelectedPolicyKeys(draft.selectedPolicyKeys);
    if (!draft.selectedPolicyKeys.length) throw new Error("Select at least one packet document.");
    return draft;
  }
  if (step === 2) {
    const launch = record(draft.websiteLaunch) ? draft.websiteLaunch : {};
    const domain = record(draft.domain) ? draft.domain : {};
    const care = record(draft.maintenanceSupport) ? draft.maintenanceSupport : {};
    const warranty = record(draft.warranty) ? draft.warranty : {};
    launch.liveUrl = validateOptionalText(launch.liveUrl, "Final live URL");
    domain.primaryDomain = validateOptionalText(domain.primaryDomain, "Domain");
    care.clientCareDisposition = validateOptionalText(care.clientCareDisposition, "Client Care choice");
    warranty.endDate = validateOptionalText(warranty.endDate, "Warranty end date");
    draft.adminNote = validateOptionalText(draft.adminNote, "Admin note");
    if (launch.liveUrl) {
      try { const url = new URL(launch.liveUrl); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); }
      catch { throw new Error(`Invalid URL: ${launch.liveUrl}`); }
    }
    if (!HANDOFF_CARE_DISPOSITIONS.includes(care.clientCareDisposition)) throw new Error("Invalid Client Care disposition.");
    validateDate(warranty.endDate, "warranty.endDate");
    return draft;
  }
  if (step === 3) return draft;
  throw new Error("Invalid handoff wizard step.");
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
    github_access: facts.websiteProvisioningSucceeded ? "COMPLETED" : null,
    netlify_access: facts.netlifyProvisioningSucceeded ? "COMPLETED" : null,
    third_party_services: services.length === 0 ? "NOT_APPLICABLE" : null,
    analytics_access: analyticsRecorded ? null : "NOT_APPLICABLE",
    forms_email_access: formsEmailRecorded ? null : "NOT_APPLICABLE",
    client_care_selection: text(facts.clientCareDisposition).trim() ? "COMPLETED" : null,
  };
  return items.map((item) => item.status === "PENDING" && automatic[item.key] ? { ...item, status: automatic[item.key] } : item);
}

export function guidedHandoffCompletion(draft, checklist) {
  const normalized = normalizeHandoffDraft(draft), items = Array.isArray(checklist) ? checklist : [];
  const unresolvedLaunch = items.some((item) => record(item) && item.required && item.key === "final_live_url" && item.status === "PENDING");
  const unresolvedOwnership = items.some((item) => record(item) && item.required && ["domain_access", "domain_ownership", "github_access", "netlify_access"].includes(item.key) && item.status === "PENDING");
  const launch = Boolean(normalized.websiteLaunch.liveUrl.trim()) && Boolean(normalized.websiteLaunch.status) && normalized.websiteLaunch.status !== "PENDING_LAUNCH" && !unresolvedLaunch;
  const ownership = [normalized.domain.owner, normalized.domain.registrar, normalized.domain.renewalResponsibility, normalized.domain.dnsManager, normalized.domain.transferAccessStatus].every((value) => value.trim()) && normalized.domain.transferAccessStatus !== "PENDING" && !unresolvedOwnership;
  const care = Boolean(normalized.maintenanceSupport.clientCareDisposition);
  return [launch, ownership, care, false];
}

export function initialHandoffWizardStep(completion) {
  const firstIncomplete = completion.slice(0, 3).findIndex((done) => !done);
  return firstIncomplete === -1 ? 4 : firstIncomplete + 1;
}

export function handoffWizardStepAfterSave(currentStep, completion, saveSucceeded) {
  if (!saveSucceeded || currentStep === 4 || !completion[currentStep - 1]) return currentStep;
  return currentStep + 1;
}

export function canNavigateToHandoffStep(targetStep, currentStep, completion) {
  return targetStep === currentStep || targetStep < currentStep && Boolean(completion[targetStep - 1]);
}

export function shouldUseEditableHandoffWizard(packetStatus) {
  return packetStatus === "DRAFT";
}
