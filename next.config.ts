import type { NextConfig } from "next";

const r2PublicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN?.trim()
  .replace(/^https?:\/\//, "")
  .replace(/\/.*$/, "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(r2PublicDomain
        ? [
            {
              protocol: "https" as const,
              hostname: r2PublicDomain,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
