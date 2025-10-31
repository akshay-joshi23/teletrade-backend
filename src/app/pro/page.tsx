"use client";
import { useState } from "react";
import AvailabilityToggle from "@/components/AvailabilityToggle";
import { TradePicker } from "@/components/TradePicker";
import { type Trade } from "@/lib/types";

export default function ProPage() {
  const [available, setAvailable] = useState<boolean>(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | "">("");
  return (
    <main className="tt-section">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold">Pro Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-300">Set your availability and take instant consults.</p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2">
          <div className="tt-card space-y-4">
            <h2 className="text-lg font-semibold">Availability</h2>
            <AvailabilityToggle
              id="pro-availability-toggle"
              type="button"
              pressed={available}
              onClick={() => setAvailable((v) => !v)}
            />
          </div>

          <div className="tt-card space-y-4">
            <h2 className="text-lg font-semibold">Trade</h2>
            <TradePicker
              id="pro-trade-select"
              value={selectedTrade}
              onChange={(e) => setSelectedTrade((e.target.value || "") as Trade | "")}
            />
          </div>
        </section>

        <section className="tt-card" id="pro-status">
          <h2 className="text-lg font-semibold mb-2">Status</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {available ? "Available" : "Unavailable"}
            {selectedTrade ? ` • ${selectedTrade}` : ""}
          </p>
        </section>
      </div>
    </main>
  );
}


