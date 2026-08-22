import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";

// Deliberately outside the (admin) route group — no sidebar/topbar chrome,
// matches the public portal's philosophy of each surface having its own
// minimal shell (see ARCHITECTURE.md §3).
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

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
        <h1 className="mb-1 text-center text-lg font-semibold text-foreground">Sign in</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">Admin access only.</p>
        <LoginForm callbackUrl={callbackUrl || "/"} />
      </div>
    </div>
  );
}
