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
  // App Router is now the default
  // Pages Router has been removed
  experimental: {
    // Warning: This config is subject to change as Next.js evolves
    
  },
  // Using src directory is handled by tsconfig.json and package.json settings
};

module.exports = nextConfig; 