/** @type {import('next').NextConfig} */
const backendUrl = (process.env.BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");

if (process.env.VERCEL && !process.env.BACKEND_URL) {
  console.warn(
    "[g-ai-site] BACKEND_URL is not set: the store will show its sample catalog and checkout stays disabled. " +
      "Set it in Vercel → Settings → Environment Variables and redeploy."
  );
}

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@g-ai/ui"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  // Same-origin proxy to FastAPI (see ADR-0001), so the store needs no CORS and
  // an optional session cookie stays first-party.
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${backendUrl}/api/v1/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
