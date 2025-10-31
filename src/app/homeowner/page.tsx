import { TradePicker } from "@/components/TradePicker";
import { ZipInput } from "@/components/ZipInput";
import Button from "@/components/ui/Button";

export default function HomeownerPage() {
  return (
    <main className="tt-section">
      <div className="max-w-2xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Homeowner</h1>
          <p className="text-zinc-600 dark:text-zinc-300">Skip the first visit. Diagnose now. Fix faster.</p>
        </header>

        <div className="tt-card">
          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="trade-select" className="text-sm font-medium">
                Trade
              </label>
              <TradePicker id="trade-select" />
            </div>

            <div className="space-y-2">
              <label htmlFor="zip-input" className="text-sm font-medium">
                ZIP code
              </label>
              <ZipInput id="zip-input" />
            </div>

            <div className="pt-2">
              <Button id="btn-instant-consult" data-action="enqueue" type="button" className="w-full">
                Instant Consult
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}


