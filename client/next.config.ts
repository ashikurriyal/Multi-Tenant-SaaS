import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    instantInsights: {
      // Validate only segments that export `instant`. Public server-rendered pages opt in
      // with `export const instant = true`; the signed-in app (/[orgSlug]/…) can't be
      // prerendered because the access token exists only in browser memory.
      validationLevel: "manual-warning",
    },
  },
  // Proxy /api/* to Express so the refresh-token cookie stays first-party (docs section 5.2)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL ?? "http://localhost:5050"}/api/:path*`,
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
