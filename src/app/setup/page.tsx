import { redirect } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { SetupForm } from "@/components/auth/setup-form";

// One-time admin bootstrap — reachable only while the database has zero
// users. Once the first account exists, this route permanently redirects
// to /login instead. See ARCHITECTURE.md §6 for why this exists instead of
// requiring a plaintext password in .env.
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const userCount = await db.user.count();
  if (userCount > 0) redirect("/login");

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
          Create your admin account
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          This is a one-time setup — this page won&apos;t work again once your account exists.
        </p>
        <SetupForm />
      </div>
    </div>
  );
}
