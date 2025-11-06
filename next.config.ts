import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  typedRoutes: true,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },

  // Disable Turbopack to avoid potential issues with static generation
  // turbopack: {},

  webpack: (config) => {
    config.externals.push("@node-rs/argon2", "@node-rs/bcrypt");
    return config;
  },
};

export default nextConfig;
