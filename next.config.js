const repository = process.env.GITHUB_REPOSITORY || '';
const [repositoryOwner = '', repositoryName = ''] = repository.split('/');
const configuredBasePath =
  process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || '';
const runningOnGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const isUserOrOrgPagesRepo =
  repositoryName.toLowerCase() === `${repositoryOwner.toLowerCase()}.github.io`;

const basePath =
  configuredBasePath ||
  (runningOnGitHubActions && repositoryName && !isUserOrOrgPagesRepo
    ? `/${repositoryName}`
    : '');

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  (repositoryOwner && repositoryName
    ? `https://${repositoryOwner}.github.io${
        isUserOrOrgPagesRepo ? '' : `/${repositoryName}`
      }`
    : 'http://localhost:3000');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
};

module.exports = nextConfig;
