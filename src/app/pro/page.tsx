"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import AvailabilityToggle from "@/components/AvailabilityToggle";
import { TradePicker } from "@/components/TradePicker";
import { type Trade } from "@/lib/types";
import { useRouter } from "next/navigation";
import { getApiBase } from "@/lib/apiBase";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ProPage() {
  const [API_BASE, setApiBase] = useState<string>("");
  useEffect(() => {
    setApiBase(getApiBase());
  }, []);
  const [available, setAvailable] = useState<boolean>(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | "">("");
  const [statusMsg, setStatusMsg] = useState<string>("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current as unknown as number);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      fetch(`${API_BASE}/api/match/poll`, { credentials: "omit" }).then(async (r) => {
        const data = (await r.json()) as { status: "waiting" | "paired"; roomId?: string };
        if (data.status === "paired" && data.roomId) {
          stopPolling();
          router.push(`/room/${data.roomId}?role=pro`);
        }
      });
    }, 2000);
  }, [router, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    if (!available) {
      setStatusMsg("");
      stopPolling();
      fetch(`${API_BASE}/api/match/leave`, { method: "POST", credentials: "omit" });
      return;
    }
    if (!selectedTrade) {
      setStatusMsg("Select a trade to go available.");
      return;
    }
    setStatusMsg("You’re available. Waiting for a homeowner…");
    fetch(`${API_BASE}/api/match/enqueue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({ role: "pro", trade: selectedTrade }),
    })
      .then((r) => r.json())
      .then((data: { status: "queued" | "paired"; roomId?: string }) => {
        if (data.status === "paired" && data.roomId) {
          router.push(`/room/${data.roomId}?role=pro`);
        } else {
          startPolling();
        }
      });
  }, [available, selectedTrade, startPolling, stopPolling, router]);
  return (
    <main className="py-10 sm:py-16">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="mb-2">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Pro Dashboard</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">Set your availability and take instant consults.</p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-black/10 bg-white shadow-lg/10 dark:bg-zinc-900/60 dark:border-white/10 p-6">
            <h2 className="text-lg font-semibold">Availability</h2>
            <AvailabilityToggle
              id="pro-availability-toggle"
              type="button"
              pressed={available}
              onClick={() => setAvailable((v) => !v)}
            />
          </div>

          <div className="rounded-2xl border border-black/10 bg-white shadow-lg/10 dark:bg-zinc-900/60 dark:border-white/10 p-6">
            <h2 className="text-lg font-semibold">Trade</h2>
            <TradePicker
              id="pro-trade-select"
              value={selectedTrade}
              onChange={(e) => setSelectedTrade((e.target.value || "") as Trade | "")}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white shadow-lg/10 dark:bg-zinc-900/60 dark:border-white/10 p-6" id="pro-status">
          <h2 className="text-lg font-semibold mb-2">Status</h2>
        <p className="flex items-center text-sm text-zinc-600 dark:text-zinc-300">
          {available && statusMsg.includes("Waiting") && (
            <span
              className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent"
              aria-hidden="true"
            />
          )}
          {statusMsg || (available ? "Available" : "Unavailable")}
        </p>
        </section>
      </div>
    </main>
  );
}


