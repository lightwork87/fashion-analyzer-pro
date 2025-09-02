/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['images.clerk.dev', 'img.clerk.com'],
  },
  // Increase payload size limits
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
  // Better for Vercel deployment
  output: 'standalone',
  trailingSlash: false,
}

module.exports = nextConfig;