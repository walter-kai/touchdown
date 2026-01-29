/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  images: {
    remotePatterns: [
      { hostname: 'a.espncdn.com' },
      { hostname: 'lh3.googleusercontent.com' },
      { hostname: 'site.api.espn.com' },
    ],
  },
  async rewrites() {
    return {
      fallback: [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/api/:path*',
        },
      ],
    };
  },
  onDemandEntries: {
    // Keep error pages in-memory instead of trying to prerender
    maxInactiveAge: 60000,
    pagesBufferLength: 50,
  },
};

module.exports = nextConfig;
