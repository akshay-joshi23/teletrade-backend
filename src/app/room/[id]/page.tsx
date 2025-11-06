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
    <main className="tt-section">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold">Room: {id}</h1>
          <p className="text-zinc-600 dark:text-zinc-300">You’re connected.</p>
        </header>
        <ErrorBoundary>
          <div className="space-y-4">
            <RoomClient roomId={id} role={role || "homeowner"} />
            <OutcomePanel roomId={id} role={role} />
          </div>
        </ErrorBoundary>
      </div>
    </main>
  );
}


