/**
 * Email HTML is built with an inline-styled, table-based layout on purpose
 * — this is the one place in the app where modern CSS (flexbox, custom
 * properties, external stylesheets) can't be trusted, since many email
 * clients (Outlook especially) strip anything that isn't an inline style
 * on a table. Keep it that way even if it looks dated compared to the rest
 * of the codebase.
 */
export function renderSelectionEmail({
  clientName,
  templateName,
  dateStr,
  clientAdminUrl,
}: {
  clientName: string;
  templateName: string;
  dateStr: string;
  clientAdminUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;">
            <tr>
              <td style="background-color:#1b2951;padding:28px 32px;text-align:center;border-radius:12px 12px 0 0;">
                <img src="cid:wordmark" alt="WebDashy" width="150" style="display:block;margin:0 auto;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 0;text-align:center;">
                <span style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:50%;background-color:#f0ffdf;font-size:26px;">🎉</span>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;text-align:center;">
                <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;">New Template Selection</p>
                <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;color:#1b2951;font-weight:700;">${escapeHtml(clientName)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                  <tr>
                    <td style="padding:16px 24px;text-align:center;">
                      <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;">Selected Template</p>
                      <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#1b2951;">${escapeHtml(templateName)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0;text-align:center;">
                <p style="margin:0;font-size:13px;color:#94a3b8;">${escapeHtml(dateStr)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px;text-align:center;">
                <a href="${clientAdminUrl}" style="display:inline-block;background-color:#a4ff4f;color:#1b2951;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:8px;">View Client Record →</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px;text-align:center;border-top:1px solid #f1f5f9;margin-top:8px;">
                <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">You're receiving this because a client confirmed a template selection on your WebDashy portal.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Client-facing — sent with the invoice PDF attached. */
export function renderInvoiceEmail({
  contactName,
  businessName,
  invoiceNumber,
  totalDue,
  dueDateStr,
  terms,
  paymentInstructions,
}: {
  contactName: string;
  businessName: string;
  invoiceNumber: string;
  totalDue: string;
  dueDateStr: string;
  terms: string;
  paymentInstructions: string | null;
}): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;">
            <tr>
              <td style="background-color:#1b2951;padding:28px 32px;text-align:center;border-radius:12px 12px 0 0;">
                <img src="cid:wordmark" alt="WebDashy" width="150" style="display:block;margin:0 auto;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 0;">
                <p style="margin:0 0 14px;font-size:14px;color:#334155;">Hi ${escapeHtml(contactName)},</p>
                <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#334155;">Thanks for choosing WebDashy for the ${escapeHtml(businessName)} website project! Here's your invoice — the PDF is attached, and a summary is below.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                  <tr>
                    <td style="padding:16px 24px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr><td style="font-size:13px;color:#475569;padding:3px 0;">Invoice</td><td style="font-size:13px;color:#1b2951;font-weight:700;text-align:right;padding:3px 0;">${escapeHtml(invoiceNumber)}</td></tr>
                        <tr><td style="font-size:13px;color:#475569;padding:3px 0;">Due date</td><td style="font-size:13px;color:#1b2951;font-weight:700;text-align:right;padding:3px 0;">${escapeHtml(dueDateStr)}</td></tr>
                        <tr><td style="font-size:13px;color:#475569;padding:3px 0;">Terms</td><td style="font-size:13px;color:#1b2951;font-weight:700;text-align:right;padding:3px 0;">${escapeHtml(terms)}</td></tr>
                        <tr><td style="font-size:14px;font-weight:800;color:#1b2951;padding:10px 0 0;border-top:1px solid #e2e8f0;margin-top:6px;">Total Due</td><td style="font-size:15px;font-weight:800;color:#1b2951;text-align:right;padding:10px 0 0;border-top:1px solid #e2e8f0;">${escapeHtml(totalDue)}</td></tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${
              paymentInstructions
                ? `<tr><td style="padding:20px 32px 0;"><p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">${escapeHtml(paymentInstructions)}</p></td></tr>`
                : ""
            }
            <tr>
              <td style="padding:20px 32px 32px;text-align:center;border-top:1px solid #f1f5f9;margin-top:8px;">
                <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">Questions about this invoice? Just reply to this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Client-facing — sent when the admin marks the site Delivered. */
export function renderDeliveryReviewEmail({
  contactName,
  businessName,
  liveUrl,
  reviewUrl,
}: {
  contactName: string;
  businessName: string;
  liveUrl: string;
  reviewUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;">
            <tr>
              <td style="background-color:#1b2951;padding:28px 32px;text-align:center;border-radius:12px 12px 0 0;">
                <img src="cid:wordmark" alt="WebDashy" width="150" style="display:block;margin:0 auto;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 0;text-align:center;">
                <span style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:50%;background-color:#f0ffdf;font-size:26px;">🚀</span>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;text-align:center;">
                <h1 style="margin:0;font-size:20px;line-height:1.3;color:#1b2951;font-weight:700;">Your website is ready for review!</h1>
                <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#475569;">Hi ${escapeHtml(contactName)}, the ${escapeHtml(businessName)} site is built and live at:</p>
                <p style="margin:6px 0 0;font-size:14px;"><a href="${liveUrl}" style="color:#1b2951;font-weight:700;">${escapeHtml(liveUrl)}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px;text-align:center;">
                <a href="${reviewUrl}" style="display:inline-block;background-color:#a4ff4f;color:#1b2951;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:8px;">Review &amp; Approve →</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0;text-align:center;">
                <p style="margin:0;font-size:13px;color:#94a3b8;">Take a look around, then approve it or let us know if anything needs changing.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px;text-align:center;border-top:1px solid #f1f5f9;margin-top:8px;">
                <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">You're receiving this because you're a WebDashy client.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Admin-facing — notifies the admin of the client's review decision. */
export function renderReviewOutcomeEmail({
  clientName,
  approved,
  feedback,
  clientAdminUrl,
}: {
  clientName: string;
  approved: boolean;
  feedback: string | null;
  clientAdminUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;">
            <tr>
              <td style="background-color:#1b2951;padding:28px 32px;text-align:center;border-radius:12px 12px 0 0;">
                <img src="cid:wordmark" alt="WebDashy" width="150" style="display:block;margin:0 auto;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 0;text-align:center;">
                <span style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:50%;background-color:${approved ? "#f0ffdf" : "#fff7ed"};font-size:26px;">${approved ? "🎉" : "✏️"}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;text-align:center;">
                <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;">${approved ? "Site Approved" : "Changes Requested"}</p>
                <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;color:#1b2951;font-weight:700;">${escapeHtml(clientName)}</h1>
              </td>
            </tr>
            ${
              feedback
                ? `<tr><td style="padding:24px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;"><tr><td style="padding:16px 24px;font-size:14px;font-style:italic;color:#334155;">"${escapeHtml(feedback)}"</td></tr></table></td></tr>`
                : ""
            }
            <tr>
              <td style="padding:28px 32px 8px;text-align:center;">
                <a href="${clientAdminUrl}" style="display:inline-block;background-color:#a4ff4f;color:#1b2951;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:8px;">View Client Record →</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px;text-align:center;border-top:1px solid #f1f5f9;margin-top:8px;">
                <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">You're receiving this because a client responded to a delivery review on your WebDashy portal.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Sent to the admin themselves — the "forgot password" flow. */
export function renderPasswordResetEmail({
  name,
  resetUrl,
}: {
  name: string;
  resetUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;">
            <tr>
              <td style="background-color:#1b2951;padding:28px 32px;text-align:center;border-radius:12px 12px 0 0;">
                <img src="cid:wordmark" alt="WebDashy" width="150" style="display:block;margin:0 auto;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 0;text-align:center;">
                <h1 style="margin:0;font-size:20px;line-height:1.3;color:#1b2951;font-weight:700;">Reset your password</h1>
                <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#475569;">Hi ${escapeHtml(name)}, we received a request to reset your WebDashy admin password.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px;text-align:center;">
                <a href="${resetUrl}" style="display:inline-block;background-color:#a4ff4f;color:#1b2951;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:8px;">Reset Password →</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0;text-align:center;">
                <p style="margin:0;font-size:13px;color:#94a3b8;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px;text-align:center;border-top:1px solid #f1f5f9;margin-top:8px;">
                <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">You're receiving this because a password reset was requested for your WebDashy admin account.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Client-facing — the link to fill out the Design Questionnaire. */
export function renderQuestionnaireEmail({
  contactName,
  businessName,
  formUrl,
}: {
  contactName: string;
  businessName: string;
  formUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;">
            <tr>
              <td style="background-color:#1b2951;padding:28px 32px;text-align:center;border-radius:12px 12px 0 0;">
                <img src="cid:wordmark" alt="WebDashy" width="150" style="display:block;margin:0 auto;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 0;text-align:center;">
                <span style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:50%;background-color:#f0ffdf;font-size:26px;">📝</span>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;text-align:center;">
                <h1 style="margin:0;font-size:20px;line-height:1.3;color:#1b2951;font-weight:700;">Let's design your new website</h1>
                <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#475569;">Hi ${escapeHtml(contactName)}, before we get started on ${escapeHtml(businessName)}'s new site, I'd love to learn more about your business, goals, and style. It takes about 15–20 minutes, and you can save your progress and come back any time.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px;text-align:center;">
                <a href="${formUrl}" style="display:inline-block;background-color:#a4ff4f;color:#1b2951;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:8px;">Start the Questionnaire →</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0;text-align:center;">
                <p style="margin:0;font-size:13px;color:#94a3b8;">This link is unique to you — once you submit, it'll show your submission status instead. Need to change something after submitting? Just reply or email garrett@webdashy.com.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px;text-align:center;border-top:1px solid #f1f5f9;margin-top:8px;">
                <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">You're receiving this because you're working with WebDashy on a new website.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Admin-facing — notifies the admin a client submitted their questionnaire. */
export function renderQuestionnaireSubmittedEmail({
  clientName,
  clientAdminUrl,
}: {
  clientName: string;
  clientAdminUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;">
            <tr>
              <td style="background-color:#1b2951;padding:28px 32px;text-align:center;border-radius:12px 12px 0 0;">
                <img src="cid:wordmark" alt="WebDashy" width="150" style="display:block;margin:0 auto;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 0;text-align:center;">
                <span style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:50%;background-color:#f0ffdf;font-size:26px;">✅</span>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;text-align:center;">
                <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;">Design Questionnaire Submitted</p>
                <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;color:#1b2951;font-weight:700;">${escapeHtml(clientName)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px;text-align:center;">
                <a href="${clientAdminUrl}" style="display:inline-block;background-color:#a4ff4f;color:#1b2951;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:8px;">View Responses →</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px;text-align:center;border-top:1px solid #f1f5f9;margin-top:8px;">
                <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">You're receiving this because a client submitted their Design Questionnaire on your WebDashy portal.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
