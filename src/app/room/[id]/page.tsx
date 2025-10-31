export default function RoomPage({ params }: { params: { id: string } }) {
  return (
    <main className="tt-section">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold">Room: {params.id}</h1>
          <p className="text-zinc-600 dark:text-zinc-300">You’re connected. (Video UI coming soon.)</p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px] items-start">
          {/* Remote video area */}
          <div id="room-remote" className="aspect-video w-full bg-black/90 rounded-lg" />

          <div className="space-y-4">
            {/* Self preview */}
            <div id="room-self" className="aspect-video w-full bg-black/70 rounded-lg" />

            {/* Controls */}
            <div className="tt-card flex items-center justify-center gap-3">
              <button id="btn-mic" className="tt-btn-secondary">Mute</button>
              <button id="btn-cam" className="tt-btn-secondary">Camera</button>
              <a id="btn-end" href="/homeowner" className="tt-btn-primary">End</a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


