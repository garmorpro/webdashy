const SAFE_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "dev.webdashy.com"]);

export function isEmailDryRunEnabled(env = process.env) {
  return env.EMAIL_DRY_RUN === "true";
}

export function isSafeHandoffPreviewEnabled(env = process.env) {
  if (!isEmailDryRunEnabled(env)) return false;
  try {
    return SAFE_HOSTNAMES.has(new URL(String(env.SITE_URL ?? "")).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function transientHandoffSendResult(attempt, previewUrl, env = process.env) {
  return isSafeHandoffPreviewEnabled(env)
    ? { attempt, dryRun: true, previewUrl }
    : { attempt };
}

export function handoffSendActionState(sendResult, success) {
  return sendResult?.dryRun === true && typeof sendResult.previewUrl === "string"
    ? { success, dryRun: true, previewUrl: sendResult.previewUrl }
    : { success };
}
