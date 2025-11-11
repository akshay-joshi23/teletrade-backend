export function getApiBase(): string {
  const isServer = typeof window === "undefined";
  const apiBase = isServer ? process.env.BACKEND_URL : (process.env.NEXT_PUBLIC_BACKEND_URL as string | undefined);
  // Return empty string to use same-origin relative /api/* in this backend app
  if (!apiBase) {
    if (process.env.NODE_ENV !== "production") {
      try {
        // eslint-disable-next-line no-console
        console.warn("[apiBase] Missing BACKEND_URL / NEXT_PUBLIC_BACKEND_URL; using relative /api/*");
      } catch {}
    }
    return "";
  }
  return apiBase;
}


