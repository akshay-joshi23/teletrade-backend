"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/apiBase";

type Trade = "PLUMBING" | "ELECTRICAL" | "HVAC" | "GENERAL";
type OpenRequest = { id: string; trade: Trade; note?: string; createdAt: number };

async function startHostSession(): Promise<{ roomId: string }> {
  const res = await fetch(`${API_BASE}/api/host/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`startHostSession failed: ${res.status}`);
  return res.json();
}

async function fetchOpenRequests(trade?: Trade) {
  const qs = new URLSearchParams();
  qs.set("status", "OPEN");
  if (trade) qs.set("trade", trade);
  const res = await fetch(`${API_BASE}/api/requests?${qs.toString()}`, {
    method: "GET",
  });
  if (!res.ok) throw new Error(`fetchOpenRequests failed: ${res.status}`);
  return res.json() as Promise<OpenRequest[]>;
}

async function admitRequest(id: string): Promise<{ roomId: string }> {
  const res = await fetch(`${API_BASE}/api/requests/${id}/admit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "PRO" }),
  });
  if (!res.ok) throw new Error(`admitRequest failed: ${res.status}`);
  return res.json();
}

export default function ProDashboardPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<OpenRequest[]>([]);
  const [trade, setTrade] = useState<Trade | "">("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.info("[pro] API_BASE =", API_BASE);
  }, []);

  const startPolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const data = await fetchOpenRequests(trade || undefined);
        setRequests(data);
      } catch (e) {
        // ignore transient errors
      }
    }, 1500);
  };
  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current as unknown as number);
      pollRef.current = null;
    }
  };
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [trade]);

  const onStart = async () => {
    try {
      const { roomId } = await startHostSession();
      setRoomId(roomId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start session");
    }
  };
  const onAdmit = async (id: string) => {
    try {
      const { roomId } = await admitRequest(id);
      router.push(`/room/${roomId}?role=PRO`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to admit");
    }
  };

  return (
    <main className="py-10 sm:py-16">
      <div className="max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Pro Dashboard</h1>
        </header>
        <div className="flex items-center gap-3">
          <button className="tt-btn-primary" onClick={onStart}>Start Session</button>
          {roomId && <span className="text-sm text-zinc-600">Room: {roomId}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm">Filter trade:</label>
            <select className="tt-input" value={trade} onChange={(e) => setTrade((e.target.value || "") as Trade | "")}>
              <option value="">All</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="HVAC">HVAC</option>
              <option value="GENERAL">General</option>
            </select>
          </div>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-black/10 dark:border-white/10">
            {requests.length === 0 && <li className="p-4 text-sm text-zinc-600">No open requests.</li>}
            {requests.map((r) => (
              <li key={r.id} className="p-4 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{r.trade}</div>
                  {r.note && <div className="text-zinc-600 dark:text-zinc-300">{r.note}</div>}
                </div>
                <button className="tt-btn-secondary" onClick={() => onAdmit(r.id)}>Admit</button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}


