import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Protects every admin route. The public portal (/p/[token]), the delivery
// review page (/r/[token]), the auth routes, and the leads webhook are
// explicitly excluded — see ARCHITECTURE.md §6: every page/route excluded
// here must never require login and must check its own security instead
// (an unguessable token for /p and /r, a static API key for /api/leads —
// see that route's own comment).
export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/leads")
  ) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Everything except: the public portal, the delivery review page, static
  // assets, brand images, the favicon, and Next's own internals.
  matcher: ["/((?!p/|r/|_next/static|_next/image|brand/|favicon.ico).*)"],
};
