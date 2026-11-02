import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // One Docker image per environment, per ADR 0005.
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
