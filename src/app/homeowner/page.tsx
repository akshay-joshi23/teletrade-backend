"use client";
import { useState } from "react";
import { TradePicker } from "@/components/TradePicker";
import { ZipInput } from "@/components/ZipInput";
import Button from "@/components/ui/Button";
import { type Trade, ZIP_REGEX } from "@/lib/types";
import { useRouter } from "next/navigation";

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
    router.push("/room/demo-room");
  };

  return (
    <main className="tt-section">
      <div className="max-w-2xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Homeowner</h1>
          <p className="text-zinc-600 dark:text-zinc-300">Skip the first visit. Diagnose now. Fix faster.</p>
        </header>

        <div className="tt-card">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
              <Button id="btn-instant-consult" data-action="enqueue" type="button" className="w-full" onClick={onConsult}>
                Instant Consult
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}


