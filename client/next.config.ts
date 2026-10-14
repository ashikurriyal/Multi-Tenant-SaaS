import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Proxy /api/* to Express so the refresh-token cookie stays first-party (docs section 5.2)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL ?? "http://localhost:5000"}/api/:path*`,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
