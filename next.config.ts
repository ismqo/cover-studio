import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  devIndicators: false,
  async redirects() {
    return [{ source: "/editor", destination: "/", permanent: true }];
  },
};

export default nextConfig;
