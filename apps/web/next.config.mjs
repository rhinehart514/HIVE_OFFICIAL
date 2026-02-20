import path from 'path';
import { fileURLToPath } from 'url';
import withBundleAnalyzer from '@next/bundle-analyzer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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
      // HiveLab renamed to Lab (Jan 2026)
      {
        source: '/tools',
        destination: '/lab',
        permanent: true,
      },
      {
        source: '/tools/:path*',
        destination: '/lab/:path*',
        permanent: true,
      },
      // Legacy route redirects (Jan 2026 IA unification)
      {
        source: '/hivelab',
        destination: '/lab',
        permanent: true,
      },
      {
        source: '/hivelab/:path*',
        destination: '/lab/:path*',
        permanent: true,
      },
      {
        source: '/calendar',
        destination: '/me/calendar',
        permanent: true,
      },
      {
        source: '/notifications',
        destination: '/me/notifications',
        permanent: true,
      },
      {
        source: '/settings',
        destination: '/me/settings',
        permanent: true,
      },
      {
        source: '/settings/:path*',
        destination: '/me/settings/:path*',
        permanent: true,
      },
    ];
  },
  webpack: (config) => {
    // Ensure @/ path alias resolves correctly on Vercel
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    return config;
  },
  serverExternalPackages: ['jose'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Fix module resolution for workspace packages
  experimental: {
    reactCompiler: true,
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

export default bundleAnalyzer(nextConfig);
