import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Protects every admin route. The public portal (/p/[token]) and the auth
// routes themselves are explicitly excluded — see ARCHITECTURE.md §6: the
// public portal must never require login, security there comes entirely
// from the unguessable token.
export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/api/auth")
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
  // Everything except: the public portal, static assets, brand images, the
  // favicon, and Next's own internals.
  matcher: ["/((?!p/|_next/static|_next/image|brand/|favicon.ico).*)"],
};
