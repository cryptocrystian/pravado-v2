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
  // Enable experimental features if needed
  experimental: {},
};

export default nextConfig;
