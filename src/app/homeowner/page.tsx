"use client";
import { useEffect, useRef, useState } from "react";
import { TradePicker } from "@/components/TradePicker";
import { ZipInput } from "@/components/ZipInput";
import Button from "@/components/ui/Button";
import { type Trade, ZIP_REGEX } from "@/lib/types";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/apiBase";

export default function HomeownerPage() {
  const router = useRouter();
  const [selectedTrade, setSelectedTrade] = useState<Trade | "">("");
  const [zip, setZip] = useState<string>("");
  const [errors, setErrors] = useState<{ trade?: string; zip?: string }>({});

  const validate = () => {
    const nextErrors: { trade?: string; zip?: string } = {};
    if (!selectedTrade) nextErrors.trade = "Please choose a trade.";
    if (!ZIP_REGEX.test(zip)) nextErrors.zip = "Enter a valid 5-digit ZIP.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onConsult = () => {
    if (!validate()) return;
    setWaitingMsg("Waiting for an available pro…");
    fetch(`${API_BASE}/api/match/enqueue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({ role: "homeowner", trade: selectedTrade }),
    })
      .then((r) => r.json())
      .then((data: { status: "queued" | "paired"; roomId?: string }) => {
        if (data.status === "paired" && data.roomId) {
          router.push(`/room/${data.roomId}?role=homeowner`);
          return;
        }
        // start polling
        startPolling();
      })
      .catch(() => setWaitingMsg("Waiting for an available pro…"));
  };

  const [waitingMsg, setWaitingMsg] = useState<string>("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      fetch(`${API_BASE}/api/match/poll`, { credentials: "omit" }).then(async (r) => {
        const data = (await r.json()) as { status: "waiting" | "paired"; roomId?: string };
        if (data.status === "paired" && data.roomId) {
          stopPolling();
          router.push(`/room/${data.roomId}?role=homeowner`);
        }
      });
    }, 2000);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current as unknown as number);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    console.info("[v0] API_BASE (client) =", API_BASE);
    return () => stopPolling();
  }, []);

  const onCancel = () => {
    stopPolling();
    setWaitingMsg("");
    fetch(`${API_BASE}/api/match/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({ role: "homeowner", trade: selectedTrade || undefined }),
    });
  };

  return (
    <main className="py-10 sm:py-16">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Homeowner</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">Skip the first visit. Diagnose now. Fix faster.</p>
        </header>

        <div className="rounded-2xl border border-black/10 bg-white shadow-lg/10 dark:bg-zinc-900/60 dark:border-white/10 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/50">
          <form className="space-y-4 p-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label htmlFor="trade-select" className="text-sm font-medium">
                Trade
              </label>
              <TradePicker
                id="trade-select"
                value={selectedTrade}
                onChange={(e) => setSelectedTrade((e.target.value || "") as Trade | "")}
              />
              {errors.trade && <p className="text-sm text-red-600">{errors.trade}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="zip-input" className="text-sm font-medium">
                ZIP code
              </label>
              <ZipInput id="zip-input" value={zip} onChange={(e) => setZip(e.target.value)} />
              <p className="text-xs text-zinc-500">5 digits (e.g., 10001)</p>
              {errors.zip && <p className="text-sm text-red-600">{errors.zip}</p>}
            </div>

            <div className="pt-2">
              <Button id="btn-instant-consult" data-action="enqueue" type="button" className="w-full" onClick={onConsult} aria-busy={!!waitingMsg}>
                {waitingMsg ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" aria-hidden="true" />
                    Connecting…
                  </span>
                ) : (
                  "Instant Consult"
                )}
              </Button>
              {waitingMsg && (
                <div className="mt-3 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300">
                  <span className="flex items-center">
                    <span
                      className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent"
                      aria-hidden="true"
                    />
                    {waitingMsg}
                  </span>
                  <button type="button" className="underline" onClick={onCancel}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}


