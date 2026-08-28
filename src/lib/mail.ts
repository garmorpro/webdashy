import path from "path";
import nodemailer from "nodemailer";
import {
  renderSelectionEmail,
  renderInvoiceEmail,
  renderDeliveryReviewEmail,
  renderReviewOutcomeEmail,
  renderPasswordResetEmail,
  renderQuestionnaireEmail,
  renderQuestionnaireSubmittedEmail,
  renderPortalEmail,
} from "@/lib/email-templates";

let transporter: nodemailer.Transporter | null | undefined;

/**
 * Lazily builds (and caches) the Gmail SMTP transporter. Returns null if
 * GMAIL_USER/GMAIL_APP_PASSWORD aren't configured — notifications are
 * best-effort and must never block the actual feature (a client's
 * selection) just because email isn't set up.
 */
function getTransporter(): nodemailer.Transporter | null {
  if (transporter !== undefined) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn(
      "Email notifications not configured (GMAIL_USER / GMAIL_APP_PASSWORD missing) — skipping."
    );
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

export async function sendSelectionNotification({
  clientName,
  templateName,
  selectedAt,
  clientAdminUrl,
}: {
  clientName: string;
  templateName: string;
  selectedAt: Date;
  clientAdminUrl: string;
}): Promise<void> {
  const t = getTransporter();
  if (!t) return;

  const to = process.env.NOTIFY_EMAIL_TO || process.env.GMAIL_USER;
  const dateStr = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(selectedAt);

  const html = renderSelectionEmail({ clientName, templateName, dateStr, clientAdminUrl });
  const text = `${clientName} just selected "${templateName}" for their website.\n${dateStr}\n\nView their record: ${clientAdminUrl}`;

  // GMAIL_USER is the authenticated Gmail account (SMTP login) — MAIL_FROM
  // is a separate, optional override for the visible "From" address, used
  // once that address is verified as a Gmail "Send mail as" alias (Gmail
  // rejects/rewrites an unverified From regardless of what's set here).
  // Falls back to the Gmail address itself if no alias is configured.
  const fromAddress = process.env.MAIL_FROM || process.env.GMAIL_USER;

  try {
    await t.sendMail({
      from: `WebDashy <${fromAddress}>`,
      to,
      subject: `${clientName} selected a template — ${templateName}`,
      text,
      html,
      // Embedded (not a remote URL) so the logo always renders regardless
      // of whether the app is reachable when the recipient opens the email.
      attachments: [
        {
          filename: "wordmark.png",
          path: path.join(process.cwd(), "public/brand/wordmark-dark.png"),
          cid: "wordmark",
        },
      ],
    });
  } catch (err) {
    // Best-effort — a failed email must never surface as an error to the
    // client confirming their selection. The selection itself is already
    // committed to the database by the time this runs.
    console.error("Failed to send selection notification email:", err);
  }
}

function getFromAddress(): string | undefined {
  return process.env.MAIL_FROM || process.env.GMAIL_USER;
}

const WORDMARK_ATTACHMENT = {
  filename: "wordmark.png",
  path: path.join(process.cwd(), "public/brand/wordmark-dark.png"),
  cid: "wordmark",
};

/**
 * Emails the client their invoice with the PDF attached. Unlike
 * sendSelectionNotification (best-effort, notifies the admin), a failed
 * send here is surfaced to the caller — the admin action that calls this
 * needs to know whether the client actually received it, since there's no
 * other confirmation path yet.
 */
export async function sendInvoiceEmail({
  to,
  contactName,
  businessName,
  invoiceNumber,
  totalDue,
  dueDateStr,
  terms,
  paymentInstructions,
  pdfBuffer,
}: {
  to: string;
  contactName: string;
  businessName: string;
  invoiceNumber: string;
  totalDue: string;
  dueDateStr: string;
  terms: string;
  paymentInstructions: string | null;
  pdfBuffer: Buffer;
}): Promise<void> {
  const t = getTransporter();
  if (!t) throw new Error("Email isn't configured (GMAIL_USER / GMAIL_APP_PASSWORD missing).");

  const html = renderInvoiceEmail({
    contactName,
    businessName,
    invoiceNumber,
    totalDue,
    dueDateStr,
    terms,
    paymentInstructions,
  });
  const text = `Hi ${contactName}, your invoice ${invoiceNumber} (${totalDue}, due ${dueDateStr}) is attached.`;

  await t.sendMail({
    from: `WebDashy <${getFromAddress()}>`,
    to,
    subject: `Your invoice from WebDashy — ${invoiceNumber}`,
    text,
    html,
    attachments: [
      WORDMARK_ATTACHMENT,
      { filename: `invoice-${invoiceNumber}.pdf`, content: pdfBuffer, contentType: "application/pdf" },
    ],
  });
}

/** Emails the client their review link once the admin marks a site Delivered. Same not-best-effort reasoning as sendInvoiceEmail. */
export async function sendDeliveryReviewEmail({
  to,
  contactName,
  businessName,
  liveUrl,
  reviewUrl,
}: {
  to: string;
  contactName: string;
  businessName: string;
  liveUrl: string;
  reviewUrl: string;
}): Promise<void> {
  const t = getTransporter();
  if (!t) throw new Error("Email isn't configured (GMAIL_USER / GMAIL_APP_PASSWORD missing).");

  const html = renderDeliveryReviewEmail({ contactName, businessName, liveUrl, reviewUrl });
  const text = `Hi ${contactName}, ${businessName}'s new site is ready: ${liveUrl}\nReview it here: ${reviewUrl}`;

  await t.sendMail({
    from: `WebDashy <${getFromAddress()}>`,
    to,
    subject: `Your website is ready for review!`,
    text,
    html,
    attachments: [WORDMARK_ATTACHMENT],
  });
}

/**
 * Emails the "forgot password" reset link. Same not-best-effort reasoning
 * as sendInvoiceEmail — the caller (requestPasswordReset) needs to know if
 * this failed, even though it always tells the *visitor* the request
 * "succeeded" regardless, to avoid leaking whether an email is on file.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const t = getTransporter();
  if (!t) throw new Error("Email isn't configured (GMAIL_USER / GMAIL_APP_PASSWORD missing).");

  const html = renderPasswordResetEmail({ name, resetUrl });
  const text = `Reset your WebDashy password: ${resetUrl}\nThis link expires in 1 hour. If you didn't request this, ignore this email.`;

  await t.sendMail({
    from: `WebDashy <${getFromAddress()}>`,
    to,
    subject: "Reset your WebDashy password",
    text,
    html,
    attachments: [WORDMARK_ATTACHMENT],
  });
}

/**
 * Notifies the admin when a client approves or requests changes on a
 * delivery review — best-effort, mirrors sendSelectionNotification: never
 * let a failed send here affect the client-facing response.
 */
export async function sendReviewOutcomeNotification({
  clientName,
  approved,
  feedback,
  clientAdminUrl,
}: {
  clientName: string;
  approved: boolean;
  feedback: string | null;
  clientAdminUrl: string;
}): Promise<void> {
  const t = getTransporter();
  if (!t) return;

  const to = process.env.NOTIFY_EMAIL_TO || process.env.GMAIL_USER;
  const html = renderReviewOutcomeEmail({ clientName, approved, feedback, clientAdminUrl });
  const text = approved
    ? `${clientName} approved their delivered site.\nView their record: ${clientAdminUrl}`
    : `${clientName} requested changes: ${feedback ?? "(no comment)"}\nView their record: ${clientAdminUrl}`;

  try {
    await t.sendMail({
      from: `WebDashy <${getFromAddress()}>`,
      to,
      subject: approved ? `${clientName} approved their site` : `${clientName} requested changes`,
      text,
      html,
      attachments: [WORDMARK_ATTACHMENT],
    });
  } catch (err) {
    console.error("Failed to send review outcome notification email:", err);
  }
}

/**
 * Emails the client their unique Design Questionnaire link. Not
 * best-effort — same reasoning as sendInvoiceEmail: the admin action that
 * triggers this ("Send Questionnaire") needs to know whether the client
 * actually received it, since there's no other confirmation path.
 */
export async function sendQuestionnaireEmail({
  to,
  contactName,
  businessName,
  formUrl,
}: {
  to: string;
  contactName: string;
  businessName: string;
  formUrl: string;
}): Promise<void> {
  const t = getTransporter();
  if (!t) throw new Error("Email isn't configured (GMAIL_USER / GMAIL_APP_PASSWORD missing).");

  const html = renderQuestionnaireEmail({ contactName, businessName, formUrl });
  const text = `Hi ${contactName}, please fill out ${businessName}'s Design Questionnaire: ${formUrl}\nYou can save your progress and come back any time before submitting.`;

  await t.sendMail({
    from: `WebDashy <${getFromAddress()}>`,
    to,
    subject: "Let's design your new website — a quick questionnaire",
    text,
    html,
    attachments: [WORDMARK_ATTACHMENT],
  });
}

/**
 * Emails the client their unique Template Portal link. Not best-effort —
 * same reasoning as sendInvoiceEmail/sendQuestionnaireEmail: the admin
 * action that triggers this ("Create Portal" / "Resend") needs to know
 * whether the client actually received it.
 */
export async function sendPortalEmail({
  to,
  contactName,
  businessName,
  portalUrl,
  message,
}: {
  to: string;
  contactName: string;
  businessName: string;
  portalUrl: string;
  message: string | null;
}): Promise<void> {
  const t = getTransporter();
  if (!t) throw new Error("Email isn't configured (GMAIL_USER / GMAIL_APP_PASSWORD missing).");

  const html = renderPortalEmail({ contactName, businessName, portalUrl, message });
  const text = `Hi ${contactName}, take a look at the template options for ${businessName}'s new site and pick your favorite: ${portalUrl}`;

  await t.sendMail({
    from: `WebDashy <${getFromAddress()}>`,
    to,
    subject: "Choose a template for your new website",
    text,
    html,
    attachments: [WORDMARK_ATTACHMENT],
  });
}

/**
 * Notifies the admin when a client submits their Design Questionnaire —
 * best-effort, mirrors sendSelectionNotification: never let a failed send
 * here affect the client-facing submit confirmation.
 */
export async function sendQuestionnaireSubmittedNotification({
  clientName,
  clientAdminUrl,
}: {
  clientName: string;
  clientAdminUrl: string;
}): Promise<void> {
  const t = getTransporter();
  if (!t) return;

  const to = process.env.NOTIFY_EMAIL_TO || process.env.GMAIL_USER;
  const html = renderQuestionnaireSubmittedEmail({ clientName, clientAdminUrl });
  const text = `${clientName} submitted their Design Questionnaire.\nView responses: ${clientAdminUrl}`;

  try {
    await t.sendMail({
      from: `WebDashy <${getFromAddress()}>`,
      to,
      subject: `${clientName} submitted their Design Questionnaire`,
      text,
      html,
      attachments: [WORDMARK_ATTACHMENT],
    });
  } catch (err) {
    console.error("Failed to send questionnaire submitted notification email:", err);
  }
}
