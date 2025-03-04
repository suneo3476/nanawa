const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: 'ignored-tsconfig.json'
  },
  images: {
    domains: ['placehold.jp'],
  },
  
  // エイリアスを明示的に設定
  webpack: (config) => {
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    return config;
  },
  
  // 実験的機能を最小限に
  experimental: {
    externalDir: true
  },
  
  // リダイレクト
  async redirects() {
    return [
      {
        source: '/404',
        destination: '/',
        permanent: false
      }
    ]
  }
};

module.exports = nextConfig;