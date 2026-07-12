import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger payload sizes for Prisma edge bundling
  serverExternalPackages: ["@prisma/client", "bcryptjs"],

  // Image domains (if any external images are added later)
  images: {
    remotePatterns: [],
  },

  // Strict mode for catching issues early
  reactStrictMode: true,
};

export default nextConfig;
