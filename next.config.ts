// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 型チェックをスキップ
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
