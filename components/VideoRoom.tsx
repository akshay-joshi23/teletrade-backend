"use client";
import { useEffect, useMemo, useState } from "react";
import { LiveKitRoom, GridLayout, ParticipantTile, useRoomContext, useTracks, RoomAudioRenderer, ControlBar } from "@livekit/components-react";
import { useRouter } from "next/navigation";
import type { Room } from "livekit-client";
import { Track } from "livekit-client";
import { getApiBase } from "@/lib/apiBase";
const API_BASE = getApiBase();

type Props = { roomId: string; role?: "homeowner" | "pro" };

export default function VideoRoom({ roomId, role }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    // Pre-warm permissions so camera/mic prompts happen before LiveKit joins.
    // This reduces initial black tiles; ignore if blocked.
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true, video: true }).catch(() => {
          // Intentionally ignored; user can enable via ControlBar later
        });
      }
    } catch {}
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    fetch(`${API_BASE}/api/livekit/token`, {
      method: "POST",
      headers,
      body: JSON.stringify({ roomId, role: (role === "pro" ? "PRO" : "HOMEOWNER") }),
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

  // Subscribe to camera/screen tracks; render placeholders until media arrives.
  // Keep hooks above early returns (Rules of Hooks).
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: true },
  ]);

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
      data-lk-theme="default"
      style={{ animation: prefersReducedMotion ? "none" : undefined }}
    >
      {/* Required to play remote audio due to browser autoplay policies */}
      <RoomAudioRenderer />

      <div id="room-remote" className="w-full">
        <GridLayout tracks={tracks} className="grid gap-2" style={{ height: "70vh" }}>
          <ParticipantTile />
        </GridLayout>
      </div>
      {/* Basic media controls; keep existing End Call for redirect */}
      <ControlBar variation="minimal" />
      <Controls roomId={roomId} />
    </LiveKitRoom>
  );
}

 

function Controls({ roomId }: { roomId: string }) {
  const room = useRoomContext() as Room;
  const router = useRouter();
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
    router.push(`/summary/${roomId}`);
  };
  return (
    <div className="flex items-center gap-2">
      <button id="btn-mic" className="tt-btn-secondary" onClick={toggleMic}>
        Mic
      </button>
      <button id="btn-cam" className="tt-btn-secondary" onClick={toggleCam}>
        Camera
      </button>
      <button id="btn-end" type="button" className="tt-btn-primary" onClick={leave}>
        End Call
      </button>
    </div>
  );
}


