import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.INTERNAL_API_URL || "http://localhost:8000";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const plugin = url.searchParams.get("plugin");

  const cookieStore = await cookies();
  const res = await fetch(`${API_URL}/api/corsair/connect?plugin=${plugin}`, {
    headers: { cookie: cookieStore.toString() },
    redirect: "manual",
  });

  // Pass the state cookie from API to browser
  const stateCookie = res.headers.get("set-cookie");
  if (stateCookie) {
    const match = stateCookie.match(/corsair_oauth_state=([^;]+)/);
    if (match && match[1]) {
      cookieStore.set("corsair_oauth_state", match[1]!, { httpOnly: true, sameSite: "lax", maxAge: 600 });
    }
  }

  const location = res.headers.get("location");
  if (location) {
    redirect(location);
  }

  return new Response("Failed to get OAuth URL", { status: 500 });
}
