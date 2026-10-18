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
  // Basic security headers for the pages (SRS 20.3). /api/* is proxied to Express, which
  // sets its own with helmet, so it is left out to avoid conflicting duplicates.
  async headers() {
    return [
      {
        source: "/((?!api/).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Links with tokens (/invite/…, ?token=) never leak their path to other sites
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
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
