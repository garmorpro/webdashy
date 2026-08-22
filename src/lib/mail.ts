import path from "path";
import nodemailer from "nodemailer";
import { renderSelectionEmail } from "@/lib/email-templates";

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

  try {
    await t.sendMail({
      from: `WebDashy <${process.env.GMAIL_USER}>`,
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
