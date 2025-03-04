/** @type {import('next').NextConfig} */
const nextConfig = {
  // `output: 'export'` をコメントアウトまたは削除
  // output: 'export',
  
  // 他の設定はそのままに
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['placehold.jp'],
  },
  amp: false,
};

module.exports = nextConfig;