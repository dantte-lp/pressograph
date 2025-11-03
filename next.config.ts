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

  turbopack: {},

  webpack: (config) => {
    config.externals.push("@node-rs/argon2", "@node-rs/bcrypt");
    return config;
  },
};

export default nextConfig;
