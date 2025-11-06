"use client";
import { useEffect, useMemo, useState } from "react";
import { LiveKitRoom, GridLayout, ParticipantTile, useRoomContext } from "@livekit/components-react";
import type { Room } from "livekit-client";

type Props = { roomId: string; role?: "homeowner" | "pro" };

export default function VideoRoom({ roomId, role }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (role) headers["x-tt-role"] = role;
    fetch("/api/livekit/token", {
      method: "POST",
      headers,
      body: JSON.stringify({ roomId }),
    })
      .then(async (r) => {
        if (!active) return;
        if (!r.ok) throw new Error((await r.json()).message || "Failed to get token");
        const data = (await r.json()) as { token: string; url: string };
        setToken(data.token);
        setServerUrl(data.url);
        setError(null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [roomId, role]);

  const prefersReducedMotion = useMemo(() =>
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  []);

  if (loading)
    return (
      <div className="flex items-center justify-center gap-2 text-center">
        <span
          className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent"
          aria-hidden="true"
        />
        <span>Connecting…</span>
      </div>
    );
  if (error) return <div className="text-center text-red-600">{error}</div>;
  if (!token || !serverUrl) return <div className="text-center text-red-600">Missing LiveKit config</div>;

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect
      video
      audio
      className="space-y-4"
      style={{ animation: prefersReducedMotion ? "none" : undefined }}
    >
      <div id="room-remote" className="w-full">
        <GridLayout className="grid gap-2">
          <ParticipantTile />
        </GridLayout>
      </div>
      <div className="flex items-center gap-3">
        <div id="room-self" className="w-48">
          <SelfPreview />
        </div>
        <Controls roomId={roomId} />
      </div>
    </LiveKitRoom>
  );
}

function SelfPreview() {
  return (
    <div className="rounded-lg overflow-hidden border">
      <ParticipantTile isLocal participant={undefined as never} />
    </div>
  );
}

function Controls({ roomId }: { roomId: string }) {
  const room = useRoomContext() as Room;
  const toggleMic = async () => {
    const enabled = room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(!enabled);
  };
  const toggleCam = async () => {
    const enabled = room.localParticipant.isCameraEnabled;
    await room.localParticipant.setCameraEnabled(!enabled);
  };
  const leave = async () => {
    try {
      await room.disconnect();
    } catch {}
    window.location.href = `/summary/${roomId}`;
  };
  return (
    <div className="flex items-center gap-2">
      <button id="btn-mic" className="tt-btn-secondary" onClick={toggleMic}>
        Mic
      </button>
      <button id="btn-cam" className="tt-btn-secondary" onClick={toggleCam}>
        Camera
      </button>
      <button id="btn-end" className="tt-btn-primary" onClick={leave}>
        End Call
      </button>
    </div>
  );
}


