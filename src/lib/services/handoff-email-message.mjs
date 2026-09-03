export function handoffEmailMessage({contactName,handoffUrl,zipBuffer,zipFilename,pdfBuffer,pdfFilename,projectName,accepted=false}) {
  const revision3 = Boolean(pdfBuffer && pdfFilename);
  if (revision3) return {
    subject: `Client Agreement Ready for Signature — ${projectName || "Your Website Project"}`,
    text: `Hi ${contactName},\n\nThe Client Agreement for ${projectName || "your website project"} is ready. Review the attached agreement, then use the secure link below to sign it. A signed copy will be available through the secure link after acceptance.\n\nReview & Sign Agreement:\n${handoffUrl}\n\nThis secure link replaces any earlier agreement link.`,
    attachments:[{filename:pdfFilename,content:pdfBuffer,contentType:"application/pdf"}],
  };
  return {
    subject:accepted?"Your accepted WebDashy handoff documents":"Your WebDashy project handoff is ready",
    text:accepted?`Hi ${contactName},\n\nThe attached ZIP contains your accepted project handoff documents. You can also access them securely here:\n${handoffUrl}`:`Hi ${contactName},\n\nYour project handoff is ready to review and accept securely:\n${handoffUrl}\n\nThe attached ZIP contains the individual handoff documents. This secure link replaces any earlier handoff link.`,
    attachments:[{filename:zipFilename,content:zipBuffer,contentType:"application/zip"}],
  };
}
