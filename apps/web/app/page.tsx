import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight">
          Work at Inhumane Speed.
        </h1>
        <p className="text-xl text-gray-500">
          Your AI operator for email, calendar, and everyday workflows.
          Think less. Execute faster.
        </p>
        <Link
          href="/chat"
          className="inline-block px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Open Workspace
        </Link>
      </div>

      <footer className="absolute bottom-8 flex gap-6 text-sm text-gray-400">
        <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-gray-600">Terms of Service</Link>
      </footer>
    </main>
  );
}
