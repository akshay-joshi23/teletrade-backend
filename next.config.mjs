/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
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
