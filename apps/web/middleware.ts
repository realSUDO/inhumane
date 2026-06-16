import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.INTERNAL_API_URL || "http://localhost:8000";

export async function middleware(request: NextRequest) {
  const protectedPaths = ["/chat"];
  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  // Check session via API
  const cookie = request.headers.get("cookie") || "";
  const res = await fetch(`${API_URL}/api/auth/get-session`, {
    headers: { cookie },
  });

  if (!res.ok) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await res.json();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Pass user info via header for downstream use
  const response = NextResponse.next();
  response.headers.set("x-user-id", session.user.id);
  response.headers.set("x-user-name", session.user.name || "");
  response.headers.set("x-user-email", session.user.email || "");
  response.headers.set("x-user-image", session.user.image || "");
  return response;
}

export const config = {
  matcher: ["/chat/:path*"],
};
