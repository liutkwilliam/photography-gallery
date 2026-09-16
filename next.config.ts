import type { NextConfig } from "next";

const rawR2Domain = process.env.NEXT_PUBLIC_R2_DOMAIN || "";
const r2PublicDomain = rawR2Domain
  .replace(/^https?:\/\//, "")
  .replace(/\/.*$/, "");

const isProd = process.env.NODE_ENV === "production";
const repoName = isProd ? "/photography-gallery" : "";

const nextConfig: NextConfig = {
  // output: "export",
  // distDir: 'dist',
  // basePath: repoName,
  // assetPrefix: repoName,

  images: {
    unoptimized: true,
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
