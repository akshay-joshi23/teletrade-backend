import dynamic from "next/dynamic";
const RoomClient = dynamic(() => import("@/components/RoomClient"), { ssr: false });
const OutcomePanel = dynamic(() => import("@/components/OutcomePanel"), { ssr: false });
import ErrorBoundary from "@/components/ErrorBoundary";

export default function RoomPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { id } = params;
  const roleParam = typeof searchParams.role === "string" ? searchParams.role : undefined;
  const role = roleParam === "homeowner" || roleParam === "pro" ? roleParam : undefined;
  return (
    <main className="py-8 sm:py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Consultation</h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-300">You’re connected.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-black/10 dark:border-white/10 px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300">
              Room {id}
            </span>
            {role && (
              <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-1 text-xs text-white">
                {role === "pro" ? "PRO" : "HO"}
              </span>
            )}
          </div>
        </header>
        <ErrorBoundary>
          <div className="space-y-4">
            <RoomClient roomId={id} role={role || "homeowner"} />
            <div className="rounded-2xl border border-black/10 bg-white shadow-lg/10 dark:bg-zinc-900/60 dark:border-white/10 p-4">
              <OutcomePanel roomId={id} role={role} />
            </div>
          </div>
        </ErrorBoundary>
      </div>
    </main>
  );
}


