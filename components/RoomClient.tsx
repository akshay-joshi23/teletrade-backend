"use client";
import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  ControlBar,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { getBrowserLiveKitUrl } from "@/lib/env";

type Props = { roomId: string; role: "homeowner" | "pro" };

function VideoGrid() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: true },
  ]);
  return (
    <GridLayout tracks={tracks} style={{ height: "70vh" }}>
      <ParticipantTile />
    </GridLayout>
  );
}

export default function RoomClient({ roomId, role }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // Read from helper to surface explicit error if missing
  const serverUrl = getBrowserLiveKitUrl();

  useEffect(() => {
    (async () => {
      try {
        if (!serverUrl) throw new Error("NEXT_PUBLIC_LIVEKIT_URL is missing");

        // Pre-prompt permissions (don’t crash if blocked)
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        } catch (permErr) {
          console.warn("[Room] getUserMedia blocked or failed:", permErr);
        }

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        headers["x-tt-role"] = role;
        const resp = await fetch("/api/livekit/token", {
          method: "POST",
          headers,
          body: JSON.stringify({ roomId }),
        });
        if (!resp.ok) throw new Error(`Token fetch failed: ${resp.status}`);
        const data = (await resp.json()) as { token?: string; url?: string; message?: string };
        if (!data.token) {
          console.error("[Room] Token API response:", data);
          throw new Error(data.message || "Token missing in response");
        }
        setToken(data.token);
      } catch (e: unknown) {
        console.error("[Room] Init error:", e);
        setErr(e instanceof Error ? e.message : "Failed to initialize room");
      }
    })();
  }, [roomId, role, serverUrl]);

  if (err) {
    return (
      <div className="tt-card text-red-600">
        Could not join room: {err}
        <div className="text-xs opacity-70 mt-1">
          Check NEXT_PUBLIC_LIVEKIT_URL and /api/livekit/token; both users must share the same roomId.
        </div>
      </div>
    );
  }
  if (!token) return <div className="tt-card">Connecting… allow camera & mic when prompted.</div>;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      audio
      video
      data-lk-theme="default"
      style={{ width: "100%", height: "100%" }}
      onConnected={() => console.log("[Room] Connected to LiveKit")}
      onDisconnected={() => console.warn("[Room] Disconnected")}
      onError={(e) => console.error("[Room] LiveKit error:", e)}
    >
      <RoomAudioRenderer />
      <VideoGrid />
      <div className="mt-3">
        <ControlBar variation="minimal" />
      </div>
    </LiveKitRoom>
  );
}


