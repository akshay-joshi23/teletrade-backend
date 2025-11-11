"use client";
import { useState } from "react";
import Select from "@/components/ui/Select";
import { API_BASE } from "@/lib/apiBase";

type Props = { roomId: string; role?: "homeowner" | "pro" };

export default function OutcomePanel({ roomId, role }: Props) {
  const [outcome, setOutcome] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const onSave = async () => {
    if (!outcome) {
      setMsg("Select an outcome.");
      setStatus("error");
      return;
    }
    setLoading(true);
    setMsg("");
    setStatus("idle");
    try {
      const r = await fetch(`${API_BASE}/api/room/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, outcome, notes }),
      });
      if (!r.ok) throw new Error("Failed to save");
      setMsg("Outcome saved.");
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Failed to save outcome");
    } finally {
      setLoading(false);
    }
  };

  if (role !== "pro") {
    return (
      <div className="tt-card">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Waiting for pro to submit outcome…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="outcome-select" className="text-sm font-medium">Outcome</label>
        <Select id="outcome-select" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
          <option value="">Select outcome</option>
          <option value="resolved_remote">Resolved remotely</option>
          <option value="needs_in_person">Needs in-person visit</option>
          <option value="parts_required">Parts required</option>
        </Select>
      </div>

      <div className="space-y-1">
        <label htmlFor="outcome-notes" className="text-sm font-medium">Notes</label>
        <textarea
          id="outcome-notes"
          placeholder="Optional notes (parts list, safety notes, etc.)"
          className="w-full min-h-24 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <button id="btn-save-outcome" className="tt-btn-primary" onClick={onSave} disabled={loading}>
          {loading ? "Saving…" : "Save outcome"}
        </button>
        {msg && (
          <span
            className={`text-sm ${status === "success" ? "text-green-600" : status === "error" ? "text-red-600" : "text-zinc-600 dark:text-zinc-300"}`}
            role="status"
            aria-live="polite"
          >
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}


