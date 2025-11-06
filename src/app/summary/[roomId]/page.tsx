import { getOutcome } from "@/lib/outcomes";
import Link from "next/link";
const LOVABLE = process.env.NEXT_PUBLIC_LOVABLE_URL || "/";

export default function SummaryPage({ params }: { params: { roomId: string } }) {
  const outcome = getOutcome(params.roomId);
  if (!outcome) {
    return (
      <main className="py-10 sm:py-16">
        <div className="max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Consultation Summary</h1>
          <p>Your consultation has ended. The pro did not submit an outcome.</p>
          <Link href={LOVABLE} className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/70">Back to Homepage</Link>
        </div>
      </main>
    );
  }

  const label =
    outcome.outcome === "resolved_remote"
      ? "Resolved remotely"
      : outcome.outcome === "needs_in_person"
        ? "Needs in-person visit"
        : "Parts required";

  const showCTA = outcome.outcome === "needs_in_person" || outcome.outcome === "parts_required";

  return (
    <main className="py-10 sm:py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Consultation Summary</h1>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm">Room: {params.roomId}</p>
        </header>

        <div className="rounded-2xl border border-black/10 bg-white shadow-lg/10 dark:bg-zinc-900/60 dark:border-white/10 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">✓</span>
            <div>
              <h2 className="text-lg font-semibold">Outcome</h2>
              <div className="mt-1 inline-flex items-center rounded-full border border-black/10 dark:border-white/10 px-2 py-1 text-xs">{label}</div>
            </div>
          </div>
          {outcome.notes && (
            <div>
              <h3 className="text-sm font-medium">Notes</h3>
              <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{outcome.notes}</p>
            </div>
          )}
          {showCTA && (
            <div className="pt-2">
              <Link
                href="#"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/70"
              >
                Book in-person visit
              </Link>
            </div>
          )}
          <div className="pt-2">
            <Link
              href={LOVABLE}
              className="inline-flex items-center justify-center rounded-xl bg-transparent text-zinc-900 dark:text-zinc-100 hover:bg-zinc-900/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/15 px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400/70"
            >
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}


