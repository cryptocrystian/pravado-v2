/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@pravado/types',
    '@pravado/validators',
    '@pravado/utils',
    '@pravado/feature-flags',
  ],
  // Enable experimental features if needed
  experimental: {},
};

export default nextConfig;
