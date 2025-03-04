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
  
  // イメージ設定
  images: {
    domains: ['placehold.jp'],
  },
  
  // amp設定を削除
};

module.exports = nextConfig;