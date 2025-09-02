/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.clerk.dev', 'img.clerk.com'],
  },
  // Better for Vercel deployment
  output: 'standalone',
  trailingSlash: false,
}

module.exports = nextConfig;