import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'

export const metadata = {
  title: 'LightLister AI - AI-Powered Fashion Listing for UK Resellers',
  description: 'List fashion items on eBay and Vinted in seconds with AI-powered analysis. Smart pricing, condition grading, and SEO optimization.',
  metadataBase: new URL('https://lightlisterai.co.uk'),
  keywords: ['fashion resale', 'eBay listing tool', 'Vinted', 'AI fashion analysis', 'UK reselling', 'clothing valuation', 'automated listing'],
  authors: [{ name: 'LightLister AI' }],
  creator: 'LightLister AI',
  publisher: 'LightLister AI',
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
    title: 'LightLister AI - AI Fashion Listing Tool',
    description: 'AI-Powered Fashion Listing for UK Resellers. List on eBay & Vinted in seconds.',
    url: 'https://lightlisterai.co.uk',
    siteName: 'LightLister AI',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'LightLister AI Logo',
      }
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LightLister AI - AI Fashion Listing Tool',
    description: 'AI-Powered Fashion Listing for UK Resellers',
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