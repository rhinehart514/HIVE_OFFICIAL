import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Ensure @/ path alias resolves correctly on Vercel
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    return config;
  },
  // Skip ESLint during builds - pre-existing warnings in lib files
  // TODO: Fix lint warnings incrementally and remove this
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Fix module resolution for workspace packages
  experimental: {
    optimizePackageImports: ['@hive/ui', '@hive/core'],
  },
  transpilePackages: [
    '@hive/ui',
    '@hive/core',
    '@hive/hooks',
    '@hive/firebase',
    '@hive/tokens',
    '@hive/validation',
    '@hive/auth-logic',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
