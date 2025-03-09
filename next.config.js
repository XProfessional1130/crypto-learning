/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during production builds
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig; 