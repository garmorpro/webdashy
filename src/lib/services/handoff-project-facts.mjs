const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" ? value.trim() : "";
const list = (value) => Array.isArray(value) ? value.map(text).filter(Boolean) : [];
const compact = (value) => Object.fromEntries(Object.entries(value).filter(([, child]) => child !== "" && child !== null && child !== undefined && (!Array.isArray(child) || child.length)));

export function buildHandoffProjectFacts(draftData, context = {}) {
  const draft = record(draftData) ? draftData : {};
  const project = record(draft.projectSummary) ? draft.projectSummary : {};
  const launch = record(draft.websiteLaunch) ? draft.websiteLaunch : {};
  const domain = record(draft.domain) ? draft.domain : {};
  const hosting = record(draft.hosting) ? draft.hosting : {};
  const source = record(draft.sourceCode) ? draft.sourceCode : {};
  const care = record(draft.maintenanceSupport) ? draft.maintenanceSupport : {};
  const warranty = record(draft.warranty) ? draft.warranty : {};
  const privacy = record(draft.privacyDataCompliance) ? draft.privacyDataCompliance : {};
  const operations = record(draft.operationalResponsibilities) ? draft.operationalResponsibilities : {};
  const ownership = record(draft.ownershipResponsibilities) ? draft.ownershipResponsibilities : {};
  const requirements = record(draft.projectRequirements) ? draft.projectRequirements : {};
  const services = (Array.isArray(draft.thirdPartyServices) ? draft.thirdPartyServices : []).filter(record).map((row) => compact({
    service: text(row.service), purpose: text(row.purpose), accountResponsibility: text(row.accountOwner), billingResponsibility: text(row.billingOwner), dataHandled: text(row.dataHandled), notes: text(row.notes),
  })).filter((row) => row.service);
  const serviceNames = services.map((row) => row.service.toLowerCase()).join(" ");
  const features = [...new Set([...list(requirements.features), ...list(draft.completedDeliverables)])];
  const featureText = features.join(" ").toLowerCase();
  const forms = Boolean(text(privacy.formsDataCollected)) || /\b(form|contact|newsletter|lead|booking|application)\b/.test(`${featureText} ${serviceNames}`);
  const analytics = Boolean(text(privacy.analyticsCookies)) || /\b(analytics|tag manager|pixel|plausible|matomo)\b/.test(`${featureText} ${serviceNames}`);
  const repositoryUrl = text(source.repositoryUrl);
  const repositoryName = text(source.repositoryName) || (repositoryUrl ? repositoryUrl.replace(/\/$/, "").split("/").slice(-1)[0] : "");
  const liveUrl = text(launch.liveUrl);
  let inferredDomain = "";
  try { inferredDomain = liveUrl ? new URL(liveUrl).hostname : ""; } catch { /* validated elsewhere */ }
  return compact({
    factModelVersion: 1,
    client: compact({ businessName: text(project.clientBusinessName), contactName: text(project.clientName), contactEmail: text(project.clientEmail) }),
    project: compact({ name: text(project.projectName), type: text(project.projectType), templateName: text(project.templateName), planName: text(project.planName), scope: text(project.scope), pages: list(requirements.pages), features, contentStatus: text(requirements.contentStatus) }),
    website: compact({ liveUrl, stagingUrl: text(launch.stagingUrl), domain: text(domain.primaryDomain) || inferredDomain, launchStatus: text(launch.status) }),
    deliverables: compact({ pages: list(requirements.pages), items: features, forms, analytics }),
    technical: compact({
      repository: repositoryUrl ? compact({ url: repositoryUrl, owner: text(source.owner), name: repositoryName, visibility: text(source.visibility), defaultBranch: text(source.defaultBranch), transferStatus: text(source.clientAccessStatus) }) : undefined,
      deployment: (text(hosting.provider) || text(hosting.siteName) || text(hosting.publicUrl)) ? compact({ provider: text(hosting.provider), siteName: text(hosting.siteName), publicUrl: text(hosting.publicUrl), accountResponsibility: text(hosting.owner), billingResponsibility: text(hosting.billingResponsibility) }) : undefined,
      domain: (text(domain.primaryDomain) || inferredDomain) ? compact({ name: text(domain.primaryDomain) || inferredDomain, owner: text(domain.owner), registrar: text(domain.registrar), dnsManager: text(domain.dnsManager), renewalResponsibility: text(domain.renewalResponsibility), transferStatus: text(domain.transferAccessStatus) }) : undefined,
      services,
      operations: compact({ backups: text(operations.backups), security: text(operations.security), updatesMonitoring: text(operations.updatesMonitoring), offboardingNotes: text(operations.offboardingNotes) }),
    }),
    privacy: compact({ forms, formsDescription: text(privacy.formsDataCollected), analytics, analyticsDescription: text(privacy.analyticsCookies), privacyPolicyResponsibility: text(privacy.privacyPolicyResponsibility), accessibilityResponsibility: text(privacy.accessibilityResponsibility), complianceNotes: text(privacy.complianceNotes) }),
    ownership: compact({ clientOwns: text(ownership.clientOwns), webDashyRetainsManages: text(ownership.webDashyRetainsManages), notes: text(ownership.notes) }),
    clientCare: compact({ disposition: text(care.clientCareDisposition) || "NOT_APPLICABLE", planName: text(care.planName), supportEmail: text(care.supportEmail), responseExpectation: text(care.responseExpectation), terms: text(care.notes) }),
    warranty: compact({ startDate: text(warranty.startDate), endDate: text(warranty.endDate), terms: text(warranty.notes) }),
    history: compact({ approvalDate: text(project.approvedDate), paymentDate: text(project.paymentCompletionDate), completionDate: text(project.completionDate), launchDate: text(launch.launchDate), handoffIssueDate: text(context.issuedAt) }),
    financial: compact({ invoiceAmount: text(project.invoiceAmount), paymentComplete: Boolean(text(project.paymentCompletionDate)) }),
  });
}

export function handoffDocumentRecommendations(_facts) {
  void _facts;
  return {
    recommended: ["client_agreement"],
    conditional: [],
    optional: [],
  };
}

export function recommendedHandoffPolicyKeys(facts) {
  const groups = handoffDocumentRecommendations(facts);
  return [...groups.recommended];
}

// Deliberately separate from document generation. This normalized input can
// support a future standalone public privacy-policy generator without making
// legal claims or adding that policy to the normal closeout packet.
export function buildWebsitePrivacyPolicyFacts(facts) {
  return compact({
    businessName: facts.client?.businessName,
    contactEmail: facts.client?.contactEmail,
    hosting: facts.technical?.deployment,
    forms: facts.privacy?.forms ? facts.privacy?.formsDescription || true : undefined,
    analytics: facts.privacy?.analytics ? facts.privacy?.analyticsDescription || true : undefined,
    cookies: facts.privacy?.analytics ? facts.privacy?.analyticsDescription || true : undefined,
    thirdPartyServices: facts.technical?.services,
  });
}
