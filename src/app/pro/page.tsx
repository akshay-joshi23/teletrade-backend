import AvailabilityToggle from "@/components/AvailabilityToggle";
import { TradePicker } from "@/components/TradePicker";

export default function ProPage() {
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
            <AvailabilityToggle id="pro-availability-toggle" type="button" />
          </div>

          <div className="tt-card space-y-4">
            <h2 className="text-lg font-semibold">Trade</h2>
            <TradePicker id="pro-trade-select" />
          </div>
        </section>

        <section className="tt-card" id="pro-status">
          <h2 className="text-lg font-semibold mb-2">Status</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">No active consults. You’re ready to go.</p>
        </section>
      </div>
    </main>
  );
}


