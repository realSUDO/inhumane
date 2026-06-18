import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";

  // If someone hits inhumane.in/chat, redirect to chat.inhumane.in/chat
  // so the entire auth + app flow lives on one domain.
  if (
    (hostname === "inhumane.in" || hostname === "www.inhumane.in") &&
    request.nextUrl.pathname.startsWith("/chat")
  ) {
    const target = new URL(request.nextUrl.pathname + request.nextUrl.search, "https://chat.inhumane.in");
    return NextResponse.redirect(target, 308);
  }

  // Check for session cookie — Better Auth may use different names depending on
  // whether crossSubDomainCookies is enabled or not.
  const hasSession =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("better-auth.session_token.cross-subdomain");

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackURL", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*"],
};
