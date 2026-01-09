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
    }
    return config;
  },
  // Enable experimental features if needed
  experimental: {},
};

export default nextConfig;
