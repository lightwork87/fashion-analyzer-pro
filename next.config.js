/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: [
      'images.clerk.dev', 
      'img.clerk.com',
      'uploadthing.com',
      'utfs.io'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Essential for Vercel deployment
  trailingSlash: false,
  output: 'standalone',
  
  // Optimize for production
  swcMinify: true,
  poweredByHeader: false,
  
  // Handle large build outputs
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Webpack optimizations
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
}

module.exports = nextConfig;