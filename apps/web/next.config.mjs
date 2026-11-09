/** @type {import('next').NextConfig} */
const backendUrl = (process.env.BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");

if (process.env.VERCEL && !process.env.BACKEND_URL) {
  console.warn(
    "[g-ai] BACKEND_URL is not set: /api/v1 (login, Today sync) will not work on this deployment. " +
      "Set it in Vercel → Settings → Environment Variables and redeploy."
  );
}

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@g-ai/ui"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // The coaching app starts with onboarding; the brand landing page is the site app.
  async redirects() {
    return [{ source: "/", destination: "/quiz", permanent: false }];
  },
  // Same-origin proxy to FastAPI so the httpOnly session cookie is first-party.
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
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
