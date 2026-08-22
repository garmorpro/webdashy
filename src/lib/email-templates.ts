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

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
