import path from "path";
import nodemailer from "nodemailer";
import {
  renderSelectionEmail,
  renderInvoiceEmail,
  renderDeliveryReviewEmail,
  renderReviewOutcomeEmail,
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
