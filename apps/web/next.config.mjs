/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@hive/ui',
    '@hive/core',
    '@hive/hooks',
    '@hive/firebase',
    '@hive/tokens',
    '@hive/validation',
    '@hive/auth-logic',
  ],
};

export default nextConfig;
