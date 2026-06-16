import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default async function Home() {
  const cookieStore = await cookies();
  const res = await fetch(`${API_URL}/api/auth/get-session`, {
    headers: { cookie: cookieStore.toString() },
  });

  if (!res.ok) {
    redirect("/login");
  }

  const session = await res.json();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-semibold">Welcome, {session.user.name}</h1>
        <p className="text-gray-500">Inhumane workspace coming soon.</p>
      </div>
    </main>
  );
}
