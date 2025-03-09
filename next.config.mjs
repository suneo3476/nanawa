// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 画像最適化の対象ドメイン（必要に応じて設定）
  images: {
    domains: [],
  },
  
  // SSGに必要な出力設定
  output: 'export',
  
  // デプロイするベースパス（必要に応じて設定）
  // basePath: '',
  
  // ビルド後のアセットプリフィックス（必要に応じて設定）
  // assetPrefix: '',
  
  // 静的HTML出力の場合、動的エラーページを使用しない
  // distDir: 'out',
  
  // Amplifyデプロイ時に必要なリダイレクト設定
  trailingSlash: true,
  
  // TypeScriptビルドエラーを警告として扱う
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ESLintエラーを警告として扱う
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // デフォルトのヘッドタグを増強
  reactStrictMode: true,
  
  // インクリメンタルに静的ファイルを生成（ビルド時間の短縮が可能）
  // experimental: {
  //   incrementalStaticRegeneration: true,
  // },
};

export default nextConfig;