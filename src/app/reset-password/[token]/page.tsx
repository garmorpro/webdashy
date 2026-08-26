import Image from "next/image";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

// Public, unauthenticated by design (see /forgot-password's comment). The
// token itself isn't validated here at render time — an invalid/expired
// one just surfaces as a normal form error on submit (src/lib/actions/
// password-reset.ts's resetPassword), the same way a wrong login password
// does, rather than a separate "valid link" check leaking extra signal.
export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Image
            src="/brand/wordmark.png"
            alt="WebDashy"
            width={616}
            height={114}
            priority
            className="h-7 w-auto"
          />
        </div>
        <h1 className="mb-1 text-center text-lg font-semibold text-foreground">
          Choose a new password
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          This link works once and expires in an hour.
        </p>
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
