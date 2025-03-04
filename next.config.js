/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['placehold.jp'],
  },
  
  // 簡素化した設定
  experimental: {
    disableOptimizedLoading: true,
    externalDir: true
  },
  
  // 404ページのリダイレクト
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