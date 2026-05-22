import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Tells Turbopack to stop looking upwards and stick to this directory
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
