export function getBrowserLiveKitUrl(): string {
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!url) throw new Error("NEXT_PUBLIC_LIVEKIT_URL is missing");
  return url;
}


