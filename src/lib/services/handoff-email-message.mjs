export function handoffEmailMessage({contactName,handoffUrl,zipBuffer,zipFilename,pdfBuffer,pdfFilename,projectName,accepted=false}) {
  const revision3 = Boolean(pdfBuffer && pdfFilename);

  if (revision3) return {
    subject: `Your Client Agreement — ${projectName || "Website Project"}`,
    text: `Hi ${contactName},

Your Client Agreement for ${projectName || "your website project"} is ready for review.

A copy of the agreement is attached for your records. When you're ready, use the secure link below to review and sign the agreement electronically.

Review & Sign:
${handoffUrl}

Once the agreement has been accepted, you'll be able to access the completed signed copy through the secure link.

If you have any questions before signing, just reply to this email.

Thank you,
WebDashy`,
    attachments: [
      {
        filename: pdfFilename,
        content: pdfBuffer,
        contentType: "application/pdf"
      }
    ],
  };

  return {
    subject: accepted
      ? "Your accepted WebDashy handoff documents"
      : "Your WebDashy project handoff is ready",
    text: accepted
      ? `Hi ${contactName},

The attached ZIP contains your accepted project handoff documents.

You can also access them securely here:
${handoffUrl}`
      : `Hi ${contactName},

Your project handoff is ready to review and accept securely:
${handoffUrl}

The attached ZIP contains the individual handoff documents. This secure link replaces any earlier handoff link.`,
    attachments: [
      {
        filename: zipFilename,
        content: zipBuffer,
        contentType: "application/zip"
      }
    ],
  };
}
