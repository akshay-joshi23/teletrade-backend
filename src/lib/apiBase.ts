export function getApiBase(): string {
  const isServer = typeof window === "undefined";
  const apiBase = isServer ? process.env.BACKEND_URL : process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!apiBase && process.env.NODE_ENV !== "production") {
    try {
      // eslint-disable-next-line no-console
      console.warn("[apiBase] Missing BACKEND_URL / NEXT_PUBLIC_BACKEND_URL");
    } catch {}
  }
  return apiBase ?? "";
}


