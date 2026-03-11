import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Only protect authenticated API routes (history)
  // All pages are publicly accessible — login is handled via client-side modal
  const protectedApiPrefixes = ["/api/history"];
  const isProtectedApi = protectedApiPrefixes.some((p) => pathname.startsWith(p));

  if (isProtectedApi && !req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
