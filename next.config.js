// pathモジュールをrequireで読み込む必要があります
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 静的生成を避けるための設定
  output: 'standalone',
  
  // 404エラーを完全に無視
  onDemandEntries: {
    maxInactiveAge: 9999999999,
  },
  
  // 最小限の実験的機能
  experimental: {
    externalDir: true,
    esmExternals: 'loose',
  },
  
  // webpackの設定
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    return config;
  },
  
  // 問題のあるルートへのリダイレクト
  async redirects() {
    return [
      {
        source: '/404',
        destination: '/',
        permanent: false,
      },
      {
        source: '/_not-found',
        destination: '/',
        permanent: false,
      }
    ];
  },
};

module.exports = nextConfig;