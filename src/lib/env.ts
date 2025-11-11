export function getBrowserLiveKitUrl(): string {
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!url) throw new Error("NEXT_PUBLIC_LIVEKIT_URL is missing");
  return url;
}

export const USE_MOCKS = process.env.USE_MOCKS === "1";

