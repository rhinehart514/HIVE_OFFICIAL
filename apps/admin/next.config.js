/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Transpile workspace packages
  transpilePackages: [
    '@hive/ui',
    '@hive/tokens',
    '@hive/firebase',
    '@hive/core',
  ],

  // Keep firebase-admin server-side only
  serverExternalPackages: ['firebase-admin'],

  // Webpack config to handle firebase-admin in transpiled packages
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle firebase-admin on client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
        'firebase-admin': false,
        'firebase-admin/firestore': false,
        'firebase-admin/auth': false,
        'firebase-admin/app': false,
      };
    }
    return config;
  },

  // Image optimization
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
  },

  // Proxy admin API requests to the web app
  // Keep local auth routes on the admin app
  async rewrites() {
    return {
      afterFiles: [
        // Proxy admin-specific API routes to web app (afterFiles so local routes take priority)
        {
          source: '/api/admin/:path*',
          destination: `${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/api/admin/:path*`,
        },
      ],
    };
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
