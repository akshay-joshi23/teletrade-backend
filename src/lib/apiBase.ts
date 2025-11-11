export const API_BASE =
  typeof window === "undefined" ? process.env.BACKEND_URL : process.env.NEXT_PUBLIC_BACKEND_URL;

if (!API_BASE) {
  throw new Error("API base not configured");
}


