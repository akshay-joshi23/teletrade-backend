import { getOutcome } from "@/lib/outcomes";
import Link from "next/link";

export default function SummaryPage({ params }: { params: { roomId: string } }) {
  const outcome = getOutcome(params.roomId);
  if (!outcome) {
    return (
      <main className="tt-section">
        <div className="max-w-2xl mx-auto px-4 space-y-4">
          <h1 className="text-2xl font-bold">Consultation Summary</h1>
          <p>Your consultation has ended. The pro did not submit an outcome.</p>
          <Link href="/homeowner" className="tt-btn-secondary inline-block">Back to home</Link>
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
    <main className="tt-section">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Consultation Summary</h1>
          <p className="text-zinc-600 dark:text-zinc-300">Room: {params.roomId}</p>
        </header>

        <div className="tt-card space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Outcome</h2>
            <p>{label}</p>
          </div>
          {outcome.notes && (
            <div>
              <h3 className="text-sm font-medium">Notes</h3>
              <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{outcome.notes}</p>
            </div>
          )}
          {showCTA && (
            <div>
              <Link href="#" className="tt-btn-primary inline-block">Book in-person visit</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


