/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    // NOTE:
    // Only set NEXT_PUBLIC_BACKEND_URL in a separate frontend project that proxies to this backend.
    // In this backend app, leave NEXT_PUBLIC_BACKEND_URL empty so we use same-origin /api/*.
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    if (!backend) return [];
    try {
      const u = new URL(backend);
      return [
        {
          source: "/api/:path*",
          destination: `${u.origin}/api/:path*`,
        },
      ];
    } catch {
      return [];
    }
  },
};

export default nextConfig;
