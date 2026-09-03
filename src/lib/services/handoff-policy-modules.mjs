export const HANDOFF_POLICY_MODULES = [
  { key: "project_completion_summary", title: "Project Completion Summary", description: "Summarizes the completed project and its delivery.", defaultIncluded: true, required: false, category: "Project" },
  { key: "client_agreement", title: "Client Agreement", description: "Combines ownership, hosting, domain, service, responsibility, maintenance, and applicable warranty terms.", defaultIncluded: false, required: false, category: "Agreement" },
  { key: "website_handoff_summary", title: "Website Handoff Summary", description: "Records the live website and the key items being handed over.", defaultIncluded: true, required: false, category: "Project" },
  { key: "website_ownership_agreement", title: "Website Ownership Agreement", description: "Describes ownership of the completed website and deliverables.", defaultIncluded: true, required: false, category: "Ownership" },
  { key: "client_responsibilities_agreement", title: "Client Responsibilities Agreement", description: "Outlines the client’s responsibilities after launch.", defaultIncluded: true, required: false, category: "Responsibilities" },
  { key: "privacy_data_responsibility_notice", title: "Privacy & Data Responsibility Notice", description: "Clarifies responsibility for privacy practices and collected data.", defaultIncluded: true, required: false, category: "Privacy & Compliance" },
  { key: "third_party_services_disclosure", title: "Third-Party Services Disclosure", description: "Identifies external services connected to the website.", defaultIncluded: true, required: false, category: "Services" },
  { key: "maintenance_support_terms", title: "Maintenance & Support Terms", description: "Summarizes ongoing maintenance and support arrangements.", defaultIncluded: true, required: false, category: "Support" },
  { key: "warranty_post_launch_support_terms", title: "Warranty / Post-Launch Support Terms", description: "Records the applicable post-launch warranty or support period.", defaultIncluded: true, required: false, category: "Support" },
  { key: "final_acceptance_sign_off", title: "Final Acceptance & Sign-Off", description: "Provides the client’s final acknowledgment and acceptance.", defaultIncluded: true, required: true, category: "Acceptance" },
  { key: "domain_ownership_renewal_agreement", title: "Domain Ownership & Renewal Agreement", description: "Records domain ownership and renewal responsibility.", defaultIncluded: false, required: false, category: "Ownership" },
  { key: "source_code_repository_handoff", title: "Source Code / Repository Handoff", description: "Documents source-code location and repository handoff.", defaultIncluded: false, required: false, category: "Technical" },
  { key: "hosting_deployment_handoff", title: "Hosting / Deployment Handoff", description: "Documents the production hosting and deployment handoff.", defaultIncluded: false, required: false, category: "Technical" },
  { key: "analytics_cookies_responsibility_notice", title: "Analytics & Cookies Responsibility Notice", description: "Clarifies responsibility for analytics tools, cookies, and consent.", defaultIncluded: false, required: false, category: "Privacy & Compliance" },
  { key: "forms_customer_data_responsibility_notice", title: "Forms & Customer Data Responsibility Notice", description: "Clarifies responsibility for form submissions and customer data.", defaultIncluded: false, required: false, category: "Privacy & Compliance" },
  { key: "accessibility_responsibility_notice", title: "Accessibility Responsibility Notice", description: "Records ongoing accessibility responsibilities after launch.", defaultIncluded: false, required: false, category: "Privacy & Compliance" },
  { key: "security_backup_responsibility_notice", title: "Security & Backup Responsibility Notice", description: "Clarifies ongoing security and backup responsibilities.", defaultIncluded: false, required: false, category: "Responsibilities" },
  { key: "client_care_maintenance_plan_agreement", title: "Client Care / Maintenance Plan Agreement", description: "Records the selected Client Care or maintenance plan arrangement.", defaultIncluded: false, required: false, category: "Support" },
];

const PLACEHOLDER = "PLACEHOLDER ONLY — counsel and business review are required before production use.";
const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export function defaultHandoffPolicyKeys() {
  return HANDOFF_POLICY_MODULES.filter((policy) => policy.defaultIncluded || policy.required).map((policy) => policy.key);
}

export function normalizeSelectedPolicyKeys(value) {
  const allowed = new Set(HANDOFF_POLICY_MODULES.map((policy) => policy.key));
  const supplied = Array.isArray(value) ? value.filter((key) => typeof key === "string" && allowed.has(key)) : defaultHandoffPolicyKeys();
  const selected = new Set(supplied);
  for (const policy of HANDOFF_POLICY_MODULES) if (policy.required) selected.add(policy.key);
  return HANDOFF_POLICY_MODULES.filter((policy) => selected.has(policy.key)).map((policy) => policy.key);
}

export const REVISION_3_POLICY_KEYS = Object.freeze(["client_agreement"]);

export function normalizeSelectedPolicyKeysForSchema(schemaVersion, value) {
  return Number(schemaVersion) >= 3 ? [...REVISION_3_POLICY_KEYS] : normalizeSelectedPolicyKeys(value);
}

export function assertRevision3IssuanceInvariant(schemaVersion, selectedKeys, sections, policyModules) {
  if (Number(schemaVersion) < 3) return;
  const keys = (value) => Array.isArray(value) ? value.map((item) => typeof item === "string" ? item : String(item?.key ?? "")) : [];
  for (const [label, actual] of [
    ["selected policy/document keys", keys(selectedKeys)],
    ["snapshot.sections keys", keys(sections)],
    ["snapshot.policyModules keys", keys(policyModules)],
  ]) {
    if (actual.length !== 1 || actual[0] !== REVISION_3_POLICY_KEYS[0]) {
      throw new Error(`Revision 3 issuance invariant failed: ${label} must equal [\"client_agreement\"].`);
    }
  }
}

export function resolveHandoffPolicyModules(sections) {
  const rows = Array.isArray(sections) ? sections : [];
  const byKey = new Map(rows.filter(record).map((row) => [String(row.key ?? row.id ?? ""), row]));
  return HANDOFF_POLICY_MODULES.map((definition) => {
    const stored = byKey.get(definition.key);
    return {
      ...definition,
      ...(stored ?? {}),
      key: definition.key,
      title: typeof stored?.title === "string" ? stored.title : definition.title,
      description: typeof stored?.description === "string" ? stored.description : definition.description,
      content: typeof stored?.content === "string" ? stored.content : PLACEHOLDER,
    };
  });
}

export function selectedHandoffPolicyModules(sections, selectedKeys) {
  const rows = Array.isArray(sections) ? sections.filter(record) : [];
  const available = new Set(rows.map((row) => String(row.key ?? row.id ?? "")));
  if (![...available].some((key) => HANDOFF_POLICY_MODULES.some((policy) => policy.key === key))) {
    const selected = new Set(normalizeSelectedPolicyKeys(selectedKeys));
    return resolveHandoffPolicyModules(sections).filter((policy) => selected.has(policy.key));
  }
  const selected = new Set(Array.isArray(selectedKeys) ? selectedKeys.filter((key) => typeof key === "string" && available.has(key)) : []);
  const resolved = resolveHandoffPolicyModules(sections).filter((policy) => available.has(policy.key));
  for (const policy of resolved) if (policy.required) selected.add(policy.key);
  return resolved.filter((policy) => selected.has(policy.key));
}

export function carryForwardSelectedPolicyKeys(sections, selectedKeys) {
  const available = new Set((Array.isArray(sections) ? sections : []).filter(record).map((row) => String(row.key ?? row.id ?? "")));
  const selected = new Set(Array.isArray(selectedKeys) ? selectedKeys.filter((key) => typeof key === "string" && available.has(key)) : []);
  for (const policy of HANDOFF_POLICY_MODULES) if (policy.required && available.has(policy.key)) selected.add(policy.key);
  return HANDOFF_POLICY_MODULES.filter((policy) => selected.has(policy.key)).map((policy) => policy.key);
}
