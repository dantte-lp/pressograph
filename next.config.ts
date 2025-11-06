import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  typedRoutes: true,

  // Allow dev server to be accessed from dev-pressograph.infra4.dev
  allowedDevOrigins: [
    'dev-pressograph.infra4.dev',
    'http://dev-pressograph.infra4.dev',
    'https://dev-pressograph.infra4.dev',
  ],

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },

  // Turbopack configuration (Next.js 16 default)
  turbopack: {
    // Rules for externals that were in webpack config
    resolveAlias: {
      // Externalize native Node.js modules
      '@node-rs/argon2': 'external @node-rs/argon2',
      '@node-rs/bcrypt': 'external @node-rs/bcrypt',
    },
  },

  // Keep webpack config for backwards compatibility (when using --webpack flag)
  webpack: (config) => {
    config.externals.push("@node-rs/argon2", "@node-rs/bcrypt");
    return config;
  },
};

export default nextConfig;
