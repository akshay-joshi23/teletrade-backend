import dynamic from "next/dynamic";

const VideoRoom = dynamic(() => import("@/components/VideoRoom"), { ssr: false });

export default function RoomPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <main className="tt-section">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold">Room: {id}</h1>
          <p className="text-zinc-600 dark:text-zinc-300">You’re connected.</p>
        </header>
        <VideoRoom roomId={id} />
      </div>
    </main>
  );
}


