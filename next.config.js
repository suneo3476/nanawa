/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLintチェックをスキップ
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScriptエラーをスキップ
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 静的エクスポートモードを有効化（重要）
  output: 'export',
  
  // イメージ設定
  images: {
    unoptimized: true, // 静的エクスポートでは必要
    domains: ['placehold.jp'],
  },
};

module.exports = nextConfig;