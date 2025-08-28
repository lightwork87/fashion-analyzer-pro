/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.clerk.dev', 'img.clerk.com'],
  },
  env: {
    NEXT_PUBLIC_CLERK_DOMAIN: 'https://lightlisterai.co.uk',
  }
}

module.exports = nextConfig