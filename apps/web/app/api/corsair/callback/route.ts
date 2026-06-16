import { cookies } from "next/headers";

const API_URL = process.env.INTERNAL_API_URL || "http://localhost:8000";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookieStore = await cookies();

  const res = await fetch(`${API_URL}/api/corsair/callback${url.search}`, {
    headers: { cookie: cookieStore.toString() },
  });

  const html = await res.text();

  // Clear state cookie
  cookieStore.delete("corsair_oauth_state");

  return new Response(html, {
    status: res.status,
    headers: { "Content-Type": "text/html" },
  });
}
