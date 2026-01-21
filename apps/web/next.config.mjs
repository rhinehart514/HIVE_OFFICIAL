import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Redirect old auth routes to unified /enter flow
  // IA Spec: docs/IA_PHASE1_AUTH_ONBOARDING.md
  async redirects() {
    return [
      {
        source: '/auth/login',
        destination: '/enter',
        permanent: true,
      },
      {
        source: '/auth/verify',
        destination: '/enter',
        permanent: true,
      },
      {
        source: '/auth/expired',
        destination: '/enter?expired=true',
        permanent: true,
      },
      {
        source: '/onboarding',
        destination: '/enter?state=identity',
        permanent: true,
      },
      // /s/:handle routes are now handled by app/s/[handle] (Jan 2026 redesign)
    ];
  },
  webpack: (config) => {
    // Ensure @/ path alias resolves correctly on Vercel
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    return config;
  },
  serverExternalPackages: ['jose'],
  // Skip ESLint during builds - pre-existing warnings in lib files
  // TODO: Fix lint warnings incrementally and remove this
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Fix module resolution for workspace packages
  experimental: {
    // Expanded for better tree-shaking (5-10% faster builds)
    optimizePackageImports: [
      '@hive/ui',
      '@hive/core',
      '@hive/hooks',
      '@hive/auth-logic',
      '@hive/firebase',
      '@hive/validation',
      '@hive/tokens',
    ],
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
