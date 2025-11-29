/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@orby/types'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
