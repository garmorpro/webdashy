import { timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hashApiKey } from "@/lib/tokens";

// Public webhook — proxy.ts deliberately excludes /api/leads from its
// session check (same reasoning as /p/[token] and /r/[token]: this route
// is meant to be called by something that isn't a logged-in browser, here
// an Apple Shortcut). That means THIS handler is the entire auth boundary
// — see ARCHITECTURE.md §6 on why every route excluded from proxy.ts must
// self-check. Auth here is a static API key (Settings → API Access),
// not a session.

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Buffers of different lengths would throw in timingSafeEqual — bail out
  // early. This length check itself leaks a little timing info, but only
  // "this string isn't even the right length", never anything about a
  // correct hash's actual bytes, so it isn't a meaningful side channel.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(req: NextRequest) {
  const settings = await db.appSettings.findUnique({ where: { id: "singleton" } });
  if (!settings?.apiKeyHash) {
    return NextResponse.json(
      { error: "The leads webhook isn't enabled. Generate a key in Settings → API Access first." },
      { status: 401 }
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const providedKey = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!providedKey || !constantTimeEqual(hashApiKey(providedKey), settings.apiKeyHash)) {
    return NextResponse.json({ error: "Invalid or missing API key." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON." }, { status: 400 });
  }
  const fields = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  const businessName = str(fields.businessName);
  const contactName = str(fields.contactName);
  const email = str(fields.email);
  if (!businessName) return NextResponse.json({ error: "businessName is required." }, { status: 400 });
  if (!contactName) return NextResponse.json({ error: "contactName is required." }, { status: 400 });
  if (!email) return NextResponse.json({ error: "email is required." }, { status: 400 });

  let client;
  try {
    client = await db.client.create({
      data: {
        businessName,
        contactName,
        email,
        phone: str(fields.phone),
        industry: str(fields.industry),
        notes: str(fields.notes),
        // Defaults to "Apple Shortcut" rather than null so leads created
        // this way are identifiable later without the caller having to
        // pass anything extra — but a caller can still override it.
        leadSource: str(fields.leadSource) ?? "Apple Shortcut",
        status: "LEAD",
      },
    });
  } catch (err) {
    console.error("POST /api/leads failed:", err);
    return NextResponse.json({ error: "Something went wrong creating the lead." }, { status: 500 });
  }

  revalidatePath("/clients");

  return NextResponse.json({ id: client.id, businessName: client.businessName }, { status: 201 });
}
