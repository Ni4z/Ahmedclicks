/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
};

module.exports = nextConfig;
