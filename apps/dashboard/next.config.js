import { withSentryConfig } from '@sentry/nextjs';

// Security headers (S-INT-10)
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@pravado/types',
    '@pravado/validators',
    '@pravado/utils',
    '@pravado/feature-flags',
  ],
  // Disable ESLint blocking during production build (run lint separately in CI)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript blocking during production build (run typecheck separately)
  typescript: {
    ignoreBuildErrors: false,
  },
  // WSL2 file watcher stability settings
  // Prevents webpack cache coherency issues causing 404s on static chunks
  onDemandEntries: {
    // Keep compiled pages in memory longer (default: 60000ms)
    maxInactiveAge: 120 * 1000,
    // Keep more pages buffered (default: 5)
    pagesBufferLength: 10,
  },
  // Webpack configuration for WSL2 stability
  webpack: (config, { dev }) => {
    if (dev) {
      // Use filesystem polling on WSL2 for reliable file watching
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
      // CRITICAL: Disable webpack's persistent filesystem cache in dev
      // This prevents 404s on static chunks when cache gets out of sync with browser
      // The .next/cache/webpack directory causes issues in WSL2 with rapid file changes
      config.cache = {
        type: 'memory',
      };
    }
    return config;
  },
  // Enable experimental features if needed
  experimental: {},
  // Security headers (S-INT-10)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/app/settings/integrations',
        destination: '/app/settings',
        permanent: false,
      },
      {
        source: '/app/settings/notifications',
        destination: '/app/settings',
        permanent: false,
      },
    ];
  },
};

// Wrap with Sentry (S-INT-08) — only applies when SENTRY_AUTH_TOKEN is set
export default withSentryConfig(nextConfig, {
  // Suppresses source maps uploading logs during build
  silent: true,
  // Hide source maps from production builds
  hideSourceMaps: true,
  // Disable Sentry webpack plugin when no auth token (local dev)
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
});
