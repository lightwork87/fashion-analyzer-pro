import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'

export const metadata = {
  title: 'Fashion Analyzer Pro - AI-Powered Fashion Analysis for UK Resellers',
  description: 'Analyze fashion items with AI for optimal eBay and Vinted reselling in the UK. Get accurate valuations, condition reports, and SEO-optimized listings.',
  metadataBase: new URL('https://yourdomain.co.uk'), // REPLACE WITH YOUR DOMAIN
  keywords: ['fashion resale', 'eBay selling', 'Vinted', 'AI fashion analysis', 'UK reselling', 'clothing valuation'],
  authors: [{ name: 'Fashion Analyzer Pro' }],
  creator: 'Fashion Analyzer Pro',
  publisher: 'Fashion Analyzer Pro',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
    shortcut: '/logo.png',
  },
  openGraph: {
    title: 'Fashion Analyzer Pro - AI Fashion Analysis',
    description: 'AI-Powered Fashion Analysis for UK Resellers. Maximize profits on eBay & Vinted.',
    url: 'https://yourdomain.co.uk', // REPLACE WITH YOUR DOMAIN
    siteName: 'Fashion Analyzer Pro',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'Fashion Analyzer Pro Logo',
      }
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fashion Analyzer Pro - AI Fashion Analysis',
    description: 'AI-Powered Fashion Analysis for UK Resellers',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Add when you set up Google Search Console
  },
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en-GB">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}