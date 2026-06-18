import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
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
