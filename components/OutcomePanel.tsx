"use client";
import { useState } from "react";

type Props = { roomId: string };

export default function OutcomePanel({ roomId }: Props) {
  const [outcome, setOutcome] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    if (!outcome) {
      setMsg("Select an outcome.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const r = await fetch("/api/room/outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, outcome, notes }),
      });
      if (!r.ok) throw new Error("Failed to save");
      setMsg("Outcome saved.");
    } catch (e) {
      setMsg("Failed to save outcome.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tt-card space-y-3">
      {/* TODO: gate panel by role (pro) when auth is added */}
      <div className="space-y-1">
        <label htmlFor="outcome-select" className="text-sm font-medium">Outcome</label>
        <select
          id="outcome-select"
          className="w-full rounded-lg border border-black/15 dark:border-white/20 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/40 dark:focus:ring-white/40"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
        >
          <option value="">Select outcome</option>
          <option value="resolved_remote">Resolved remotely</option>
          <option value="needs_in_person">Needs in-person visit</option>
          <option value="parts_required">Parts required</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="outcome-notes" className="text-sm font-medium">Notes</label>
        <textarea
          id="outcome-notes"
          placeholder="Optional notes (parts list, safety notes, etc.)"
          className="w-full min-h-24 rounded-lg border border-black/15 dark:border-white/20 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/40 dark:focus:ring-white/40"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <button id="btn-save-outcome" className="tt-btn-primary" onClick={onSave} disabled={loading}>
          {loading ? "Saving…" : "Save outcome"}
        </button>
        {msg && <span className="text-sm text-zinc-600 dark:text-zinc-300">{msg}</span>}
      </div>
    </div>
  );
}


