import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 完全静的出力。out/ をそのまま静的ホスティングに置ける
  // (旧版と同じ Amplify のZIP/コミット配信運用も可能)。
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
