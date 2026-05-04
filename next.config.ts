import type { NextConfig } from "next";

const securityHeaders = [
  // Empêche la page d'être iframée (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Empêche le sniffing MIME
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limite les infos envoyées dans le Referer
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Désactive caméra/micro/géolocation par défaut
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Force HTTPS (production seulement)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
