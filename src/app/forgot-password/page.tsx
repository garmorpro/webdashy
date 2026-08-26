import Image from "next/image";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

// Public, unauthenticated by design — this is the "I forgot my password"
// recovery path. See src/lib/actions/password-reset.ts for the security
// model (unguessable emailed token, generic response either way).
export default function ForgotPasswordPage() {
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
          Reset your password
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
