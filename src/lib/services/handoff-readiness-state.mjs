export function evaluateHandoffReadiness(state) {
  const check = (key, label, pass, blockedMessage, hint) => ({
    key, label, status: pass ? "PASS" : "BLOCKED", message: pass ? `${label} is ready.` : blockedMessage, hint,
  });
  const checks = [
    check("build_setup", "Build Setup confirmed", state.buildSetupConfirmed, "Confirm Build Setup before generating a packet.", "Build Setup"),
    check("website_provisioning", "Website provisioning succeeded", state.websiteProvisioningSucceeded, "Website provisioning must succeed first.", "Website Provisioning"),
    check("netlify_provisioning", "Netlify provisioning succeeded", state.netlifyProvisioningSucceeded, "Netlify provisioning must succeed first.", "Netlify Provisioning"),
    check("delivery", "Delivery exists", state.deliveryExists, "Create the project delivery first.", "Delivery"),
    check("delivery_review", "Delivery review approved", state.deliveryReviewApproved, "The client must approve delivery review.", "Delivery"),
    check("invoices", "Applicable invoice exists", state.invoiceCount > 0, "Create at least one invoice for this portal.", "Invoice"),
    check("invoices_paid", "Applicable invoices paid", state.invoiceCount > 0 && state.unpaidInvoiceCount === 0, "All portal invoices must be paid.", "Invoice"),
    check("recipient_email", "Recipient email available", Boolean(state.recipientEmail), "Add a recipient email to the client record.", "Contact"),
    check("published_template", "Published handoff template", state.publishedTemplateExists, "Publish the default handoff template revision in Settings.", "Settings"),
  ];
  const warning = (key, label, pass, message, hint) => checks.push({ key, label, status: pass ? "PASS" : "WARNING", message: pass ? `${label} is ready.` : message, hint });
  warning("live_url", "Final live URL confirmed", Boolean(state.liveUrl), "The final live URL has not been confirmed yet.", "Delivery");
  warning("domain_details", "Domain details complete", state.domainDetailsComplete, "Registrar, ownership, or DNS responsibility still needs confirmation.", "Packet draft");
  warning("client_care", "Client care selected", state.clientCareSelected, "Client care disposition has not been selected yet.", "Packet draft");
  warning("checklist", "Required checklist complete", state.requiredChecklistPending === 0, `${state.requiredChecklistPending} required checklist item(s) remain pending.`, "Packet checklist");
  return { checks, blocked: checks.some((item) => item.status === "BLOCKED"), warningCount: checks.filter((item) => item.status === "WARNING").length };
}
