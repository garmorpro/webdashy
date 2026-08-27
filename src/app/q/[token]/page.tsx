import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { PortalShell } from "@/components/portal/portal-shell";
import { QuestionnaireWizard } from "@/components/questionnaire/questionnaire-wizard";
import type { QuestionnaireAnswers } from "@/lib/questionnaire-schema";

// Same reasoning as the template portal / delivery review pages — always
// live data, never statically prerendered.
export const dynamic = "force-dynamic";

async function getQuestionnaire(token: string) {
  return db.designQuestionnaire.findUnique({
    where: { token },
    include: { client: true },
  });
}

/** answers comes back from Prisma as Prisma.JsonValue (could be null, or
 * anything, in principle) — this app is the only writer (saveQuestionnaireProgress
 * / submitQuestionnaire), both of which only ever store a flat string map,
 * so a null-safe cast here is fine rather than a full runtime schema check. */
function toAnswers(json: unknown): QuestionnaireAnswers {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    return json as QuestionnaireAnswers;
  }
  return {};
}

function buildInitialAnswers(
  client: { contactName: string; email: string; phone: string | null; businessName: string },
  stored: QuestionnaireAnswers
): QuestionnaireAnswers {
  const [firstName, ...rest] = client.contactName.trim().split(/\s+/);
  const defaults: QuestionnaireAnswers = {
    firstName: firstName ?? "",
    lastName: rest.join(" "),
    email: client.email,
    phone: client.phone ?? "",
    companyName: client.businessName,
  };
  // Stored answers win — this only fills in what the client hasn't
  // touched yet, it never overwrites something they've already edited.
  return { ...defaults, ...stored };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const questionnaire = await getQuestionnaire(token);

  return {
    title: questionnaire
      ? `${questionnaire.client.businessName} — Design Questionnaire`
      : "Design Questionnaire",
    // Same as the template portal / review pages — an unguessable-token
    // page must never be indexed. See ARCHITECTURE.md §6.
    robots: { index: false, follow: false },
  };
}

export default async function QuestionnairePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const questionnaire = await getQuestionnaire(token);

  if (!questionnaire) notFound();

  const { client } = questionnaire;

  if (questionnaire.status === "SUBMITTED") {
    return (
      <PortalShell clientName={client.businessName} message={null} eyebrow="Design Questionnaire">
        <div className="mx-auto max-w-md rounded-3xl bg-card p-10 text-center shadow-[0_8px_24px_-14px_rgba(38,49,94,0.14)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-extrabold text-foreground">Submitted &amp; under review</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Thanks for taking the time to fill this out — I&apos;m reviewing your answers now and
            will be in touch soon with next steps.
          </p>
          <div className="mt-7 border-t border-border pt-6">
            <p className="text-xs font-medium text-muted-foreground">Need to add or change something?</p>
            <p className="mt-1 text-sm font-bold text-foreground">
              Email{" "}
              <a href="mailto:garrett@webdashy.com" className="text-emerald-600">
                garrett@webdashy.com
              </a>
            </p>
          </div>
        </div>
      </PortalShell>
    );
  }

  const initialAnswers = buildInitialAnswers(client, toAnswers(questionnaire.answers));

  return (
    <PortalShell
      clientName={client.businessName}
      eyebrow="Design Questionnaire"
      message="A few questions so I can design something that actually fits your business. Answer at your own pace — your progress saves automatically."
    >
      <QuestionnaireWizard token={token} initialAnswers={initialAnswers} />
    </PortalShell>
  );
}
