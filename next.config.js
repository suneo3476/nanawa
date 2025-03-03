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
  
  // 静的エクスポート設定を削除（コメントアウト）
  // output: 'export',
  
  // 必要に応じてイメージ設定
  images: {
    domains: ['placehold.jp'],
  },
};

module.exports = nextConfig;