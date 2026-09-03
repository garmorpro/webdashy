export const HANDOFF_TEMPLATE_REVIEW_NOTE = "Draft template — pending legal review.";

const documentModule = (key, title, category, subtitle, purpose, sections, options = {}) => ({
  key, title, category, subtitle, purpose, sections,
  description: purpose,
  content: sections.map((section) => `${section.heading}\n${section.paragraphs?.join("\n") ?? ""}${section.bullets?.join("\n") ?? ""}`).join("\n\n"),
  defaultIncluded: options.defaultIncluded ?? true,
  required: options.required ?? false,
  legalReviewRequired: options.legalReviewRequired ?? true,
  reviewNote: HANDOFF_TEMPLATE_REVIEW_NOTE,
});

export const HANDOFF_TEMPLATE_MODULES = [
  documentModule("project_completion_summary", "Project Completion Summary", "Project", "Delivery, launch, and closeout record", "This summary records the operational completion and handoff status of the project.", [
    { heading: "Completion statement", paragraphs: ["WebDashy has completed the website project identified in this packet and delivered the final implementation represented by the recorded live website. The project has reached handoff following the recorded client approval and payment completion milestones."] },
    { heading: "Delivered scope", paragraphs: ["The delivered scope includes the completed website, its production launch configuration, and the handoff items documented throughout this packet. The project-specific summary below is drawn from the trusted handoff record."] },
    { heading: "Handoff status", paragraphs: ["The website, domain, deployment, access, third-party service, support, and post-launch responsibility details are recorded in the applicable documents included with this packet."] },
    { heading: "Next steps", bullets: ["Retain this packet with the business’s website and account records.", "Confirm responsible users retain access to the domain, hosting, repository, and connected services that apply.", "Report implementation defects during the recorded warranty period and route later requests through the listed support contact."] },
  ], { legalReviewRequired: false }),
  documentModule("website_handoff_summary", "Website Handoff Summary", "Project", "Operational website and access handoff", "This document summarizes the website, deployment, source-code, account-access, and ongoing operational handoff.", [
    { heading: "Website delivered", paragraphs: ["The final website and the project records identified below have been delivered or made available according to the recorded handoff facts. URLs and account ownership details are included only when they were recorded in the packet."] },
    { heading: "Access and custody", paragraphs: ["The client should verify access for each applicable domain, hosting, repository, analytics, form, and third-party service account. Credentials and secret values are intentionally not reproduced in this document."] },
    { heading: "Ongoing responsibility", paragraphs: ["After handoff, the recorded account owner and billing owner are responsible for access administration, renewals, subscription charges, content operations, and service continuity unless an active Client Care arrangement expressly assigns a task to WebDashy."] },
    { heading: "Support", paragraphs: ["Questions and support requests should be directed to the support contact recorded below. Work outside an included warranty or Client Care scope may require a separate written scope and quote."] },
  ], { legalReviewRequired: false }),
  documentModule("website_ownership_agreement", "Website Ownership Agreement", "Ownership", "Draft allocation of website and asset ownership", "This draft records the parties’ intended ownership treatment for the completed, fully paid website deliverables. It requires legal review before production use.", [
    { heading: "Final paid deliverables", paragraphs: ["Subject to full payment, the client owns the final project-specific website deliverables expressly created for and delivered to the client, except for retained materials and third-party items described below. Ownership becomes effective only after all amounts due for the applicable project scope have been paid in full."] },
    { heading: "Client materials", paragraphs: ["Content, trademarks, photographs, data, and other materials supplied or authorized by the client remain the client’s property or responsibility. The client represents that it has the rights needed for their use and remains responsible for their accuracy and legality."] },
    { heading: "WebDashy retained materials", paragraphs: ["WebDashy retains ownership of its pre-existing and reusable tools, templates, frameworks, libraries, processes, know-how, internal systems, and generalized components unless a written project document expressly transfers a specific item. No ownership interest in WebDashy’s internal systems is implied by delivery of the website."] },
    { heading: "Third-party materials and accounts", paragraphs: ["Third-party software, fonts, media, services, platforms, and open-source components remain governed by their respective licenses and terms. No third-party account, subscription, or license is transferred unless the handoff record expressly states that transfer and the provider permits it."] },
    { heading: "Source and repository treatment", paragraphs: ["Source-code and repository ownership, location, visibility, and access are governed by the project-specific handoff facts below. Repository access does not expand ownership beyond the final paid deliverables described in this draft."] },
  ]),
  documentModule("client_responsibilities_agreement", "Client Responsibilities Agreement", "Responsibilities", "Post-handoff operating responsibilities", "This draft identifies the client’s ongoing responsibilities after website handoff.", [
    { heading: "Accounts, domain, and fees", bullets: ["Maintain domain registration, renewal, DNS access, and accurate registrant information.", "Secure account credentials, use appropriate access controls, and promptly remove access that is no longer authorized.", "Pay hosting, domain, software, licensing, and other third-party fees assigned to the client."] },
    { heading: "Content and compliance", bullets: ["Review and update website content, business information, offers, policies, and contact details.", "Ensure client-provided content and claims are accurate, lawful, and properly licensed.", "Determine and meet applicable privacy, consumer, accessibility, industry, and other compliance obligations with qualified advisers where appropriate."] },
    { heading: "Operations and changes", bullets: ["Notify WebDashy promptly of material changes, suspected security events, or problems for which support is requested.", "Maintain backups where the recorded hosting or support arrangement assigns that responsibility to the client.", "Accept responsibility for changes made by the client or third parties, including resulting defects, outages, security issues, or restoration work."] },
  ]),
  documentModule("privacy_data_responsibility_notice", "Privacy & Data Responsibility Notice", "Privacy & Compliance", "Business responsibility for privacy and customer data", "This notice allocates operational responsibility; it is not legal advice and does not represent compliance with any law.", [
    { heading: "Business decisions", paragraphs: ["The client is responsible for determining what personal or customer data its business collects, why it is collected, how it is used, where it is sent, who can access it, and how long it is retained."] },
    { heading: "Notices and consent", paragraphs: ["The client is responsible for providing accurate privacy-policy and other required disclosures, and for determining whether consent or preference controls are required for forms, analytics, cookies, advertising, or other data practices in each applicable jurisdiction."] },
    { heading: "Forms and connected services", paragraphs: ["Form submissions and customer information may pass through hosting, email, analytics, CRM, scheduling, payment, or other providers. The client must review those providers, configure appropriate access and retention, and handle received information securely."] },
    { heading: "After handoff", paragraphs: ["After handoff, the client is responsible for ongoing security, access, deletion, retention, incident response, and vendor-management decisions unless a written Client Care scope expressly says otherwise. WebDashy does not provide legal compliance advice; the client should consult qualified counsel for jurisdiction-specific requirements."] },
  ]),
  documentModule("third_party_services_disclosure", "Third-Party Services Disclosure", "Services", "Connected vendor and subscription record", "This disclosure identifies third-party services recorded for the website and explains the limits of WebDashy’s control.", [
    { heading: "Service dependencies", paragraphs: ["Third-party availability, features, pricing, security practices, licenses, and terms may change. WebDashy does not operate or control third-party services and cannot guarantee their continued availability or performance."] },
    { heading: "Ongoing subscriptions", paragraphs: ["The client remains responsible for applicable third-party accounts, billing, renewals, terms, and data practices after handoff unless the recorded Client Care arrangement expressly assigns a responsibility to WebDashy."] },
  ], { legalReviewRequired: false }),
  documentModule("maintenance_support_terms", "Maintenance & Support Terms", "Support", "Recorded Client Care and support scope", "This draft summarizes the Client Care selection and the general boundaries of maintenance and support.", [
    { heading: "Recorded arrangement", paragraphs: ["The Client Care disposition, plan name, support contact, and response expectation below control only to the extent they are recorded in this packet or an applicable signed service order. No price or service level is implied when it is not recorded."] },
    { heading: "Typical included work", paragraphs: ["When included in the selected arrangement, maintenance and support generally cover routine technical upkeep, investigation of reported website issues, and the specific monitoring or update tasks stated in the applicable plan."] },
    { heading: "Excluded work", paragraphs: ["Redesigns, new pages, new features, content production, major integrations, remediation caused by client or third-party changes, and work outside the recorded plan are excluded unless separately agreed. Third-party outages and provider changes are outside WebDashy’s control. Additional work may require a separate scope and quote."] },
  ]),
  documentModule("warranty_post_launch_support_terms", "Warranty / Post-Launch Support Terms", "Support", "Limited implementation-defect correction period", "This draft summarizes the recorded post-launch warranty period and its practical limits.", [
    { heading: "Warranty coverage", paragraphs: ["During the recorded warranty period, WebDashy will review timely reported reproducible defects attributable to the delivered implementation and, when covered, correct them within a commercially reasonable period."] },
    { heading: "Exclusions", bullets: ["Changes made by the client or another provider.", "New functionality, redesign, content entry, or changed business requirements.", "Third-party platform, browser, API, plugin, license, or service changes.", "Hosting, DNS, registrar, network, or domain outages outside WebDashy’s control.", "Issues caused by misuse, compromised credentials, or unsupported configurations."] },
    { heading: "Reporting and expiration", paragraphs: ["Report a suspected covered defect through the support contact with the affected URL, a clear description, and reproduction details. Coverage expires on the recorded end date. Any assistance after expiration is governed by an active Client Care arrangement or a separately approved scope."] },
  ]),
  documentModule("final_acceptance_sign_off", "Final Acceptance & Sign-Off", "Acceptance", "Packet review and final project acknowledgment", "This document identifies the packet being presented for acceptance and records the client’s acknowledgment of the final website and handoff materials.", [
    { heading: "Review opportunity", paragraphs: ["The client confirms that it has received or can access the documents listed below and has had an opportunity to review the packet, ask questions, and identify requested corrections before acceptance."] },
    { heading: "Deliverable acknowledgment", paragraphs: ["By accepting, the client acknowledges the final website and delivered materials identified in this packet, together with the responsibilities, disclosures, support selection, warranty terms, and other selected documents included in this exact packet version."] },
  ], { required: true }),
  documentModule("domain_ownership_renewal_agreement", "Domain Ownership & Renewal Agreement", "Ownership", "Domain custody, access, and renewal record", "This draft records domain ownership and the party responsible for renewal and DNS administration.", [
    { heading: "Domain responsibility", paragraphs: ["The recorded owner controls the domain subject to the registrar’s terms. The recorded renewal-responsible party must keep registrant details, payment methods, renewal settings, and recovery access current."] },
    { heading: "Access and continuity", paragraphs: ["The client should retain direct registrar access and protect recovery methods. DNS or registrar changes can interrupt the website and email; requested changes should be verified before implementation. WebDashy does not acquire domain ownership merely by assisting with registration or DNS."] },
  ], { defaultIncluded: false }),
  documentModule("source_code_repository_handoff", "Source Code / Repository Handoff", "Technical", "Repository location, access, and custody", "This draft records the source repository facts and the client’s ongoing custody responsibilities.", [
    { heading: "Repository handoff", paragraphs: ["The repository location, owner, visibility, branch, and access status are stated below when recorded. Secret credentials, provider identifiers, and internal administrative references are intentionally omitted."] },
    { heading: "Ongoing custody", paragraphs: ["The repository owner is responsible for user access, recovery settings, security, billing, and preserving source history. Source access remains subject to the ownership allocation and third-party licenses documented elsewhere in this packet."] },
  ], { defaultIncluded: false }),
  documentModule("hosting_deployment_handoff", "Hosting / Deployment Handoff", "Technical", "Production hosting and deployment operations", "This draft summarizes hosting ownership, billing, and deployment responsibility.", [
    { heading: "Hosting record", paragraphs: ["The public production URL and recorded hosting ownership and billing responsibilities appear below. Internal provider administration links and identifiers are not included."] },
    { heading: "Operations", paragraphs: ["The responsible party must maintain billing, authorized users, environment configuration, deployment access, and service notices. Provider outages, pricing, platform changes, and account enforcement remain subject to the provider’s terms."] },
  ], { defaultIncluded: false }),
  documentModule("analytics_cookies_responsibility_notice", "Analytics & Cookies Responsibility Notice", "Privacy & Compliance", "Analytics configuration, notices, and consent", "This notice records operational responsibility for analytics, cookies, and related technologies.", [
    { heading: "Client decisions", paragraphs: ["The client determines which analytics, advertising, pixels, cookies, and similar technologies are appropriate and is responsible for accurate disclosures, configuration, consent or preference controls where applicable, retention, access, and vendor terms."] },
    { heading: "No compliance determination", paragraphs: ["WebDashy may implement documented settings but does not determine legal requirements or represent that a configuration complies with any law. The client should obtain jurisdiction-specific legal advice."] },
  ], { defaultIncluded: false }),
  documentModule("forms_customer_data_responsibility_notice", "Forms & Customer Data Responsibility Notice", "Privacy & Compliance", "Submission routing and customer-information custody", "This notice records responsibility for information submitted through website forms and connected services.", [
    { heading: "Submission handling", paragraphs: ["The client is responsible for authorized recipients, inbox and service access, secure handling, response practices, retention, deletion, and incident procedures for form submissions and customer information."] },
    { heading: "Data minimization", paragraphs: ["The client should request only information needed for a defined business purpose and review the terms and security of every service receiving submissions. Sensitive data should not be collected through a general website form unless an appropriate system and reviewed process are in place."] },
  ], { defaultIncluded: false }),
  documentModule("accessibility_responsibility_notice", "Accessibility Responsibility Notice", "Privacy & Compliance", "Ongoing content and accessibility stewardship", "This notice records ongoing responsibility for maintaining an accessible website experience.", [
    { heading: "Ongoing responsibility", paragraphs: ["Accessibility is an ongoing practice. The client is responsible for reviewing applicable requirements and maintaining accessible content, alternatives for media, headings, links, forms, documents, color choices, and third-party embeds after handoff."] },
    { heading: "Future changes", paragraphs: ["Client or third-party changes may affect accessibility. WebDashy does not provide legal advice or guarantee compliance with a particular standard or law; audits or remediation may require a separate scope and qualified guidance."] },
  ], { defaultIncluded: false }),
  documentModule("security_backup_responsibility_notice", "Security & Backup Responsibility Notice", "Responsibilities", "Account security, recovery, and backup ownership", "This notice records the parties’ ongoing operational security and backup responsibilities.", [
    { heading: "Security practices", paragraphs: ["Responsible account owners should use unique credentials, multi-factor authentication where available, least-privilege access, prompt user removal, current recovery methods, and timely review of provider alerts."] },
    { heading: "Backups and recovery", paragraphs: ["The party assigned backup responsibility must understand what the hosting provider preserves, maintain any additional copies required by the business, and periodically verify restoration procedures. No backup or security monitoring is implied unless expressly included in a recorded Client Care scope."] },
  ], { defaultIncluded: false }),
  documentModule("client_care_maintenance_plan_agreement", "Client Care / Maintenance Plan Agreement", "Support", "Selected ongoing website care arrangement", "This draft records the selected Client Care disposition and the boundaries of any ongoing plan.", [
    { heading: "Plan record", paragraphs: ["The disposition, plan name, support contact, and response expectation below reflect the handoff snapshot. Services are limited to the applicable written plan or service order; no unrecorded price, response time, or deliverable is created by this summary."] },
    { heading: "Changes and exclusions", paragraphs: ["New features, redesign, substantial content work, third-party outages, and work caused by unauthorized changes are outside routine maintenance unless separately stated. Additional services may require written approval and a separate quote."] },
  ], { defaultIncluded: false }),
];

// Revision 2 above is intentionally unchanged. Revision 3 is the compact
// closeout architecture. Legacy module keys remain available to render older
// revisions and frozen snapshots, but are not selectable from this definition.
const revision3Module = (key, title, category, subtitle, purpose, options = {}) => ({
  key, title, category, subtitle, purpose, description: purpose,
  defaultIncluded: true, required: options.required ?? false,
  legalReviewRequired: options.legalReviewRequired ?? true,
  reviewNote: HANDOFF_TEMPLATE_REVIEW_NOTE,
  contentStrategy: "PROJECT_FACTS_V2",
});

export const HANDOFF_TEMPLATE_REVISION_3_MODULES = [
  revision3Module("client_agreement", "Client Agreement", "Agreement", "Website Project Completion, Ownership, Handoff, and Post-Launch Terms", "The project-specific agreement governing completion, ownership, handoff, post-launch responsibilities, and electronic acceptance.", { required: true }),
];

export const HANDOFF_ACCEPTANCE_TEXT = "By accepting this Client Agreement, I confirm that I am authorized to act for the Client identified in the Agreement; that the Client has reviewed and accepts the completed website and deliverables; that the Client received and reviewed this Agreement; that the ownership, post-handoff responsibilities, Client Care disposition, and any recorded warranty terms are accurately stated; and that this electronic acceptance applies to the immutable issued Agreement snapshot identified in the acceptance record.";
export const HANDOFF_REVISION_3_ACCEPTANCE_TEXT = "I confirm that I am authorized to accept this Agreement on behalf of [Client Business Name].\n\nI have reviewed and agree to the Client Agreement, including its description of the completed website and deliverables.\n\nMy typed full legal name is my electronic signature for the immutable issued Agreement snapshot identified in the acceptance record.";
