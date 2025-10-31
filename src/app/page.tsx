import Link from "next/link";

export default function Home() {
  return (
    <main className="tt-section">
      <div className="max-w-5xl mx-auto px-4">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">TeleTrades</h1>
          <p className="text-zinc-600 dark:text-zinc-300">Operational shell for functional app</p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          <Link
            id="go-homeowner"
            href="/homeowner"
            className="tt-card block hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-1">Homeowner</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Skip the first visit. Diagnose now. Fix faster.</p>
          </Link>

          <Link id="go-pro" href="/pro" className="tt-card block hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-1">Pro</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Set your availability and take instant consults.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}


