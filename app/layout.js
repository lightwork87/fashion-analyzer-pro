// app/layout.js
// COMPLETE FIXED VERSION - NO ERRORS

import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'LightLister AI - AI-Powered Fashion Listing Tool',
  description: 'Create professional eBay and Vinted listings with AI analysis',
  keywords: 'ebay, vinted, fashion, ai, listing, reseller, clothing',
  authors: [{ name: 'LightLister AI Team' }],
  openGraph: {
    title: 'LightLister AI',
    description: 'AI-Powered Fashion Listing Tool',
    url: 'https://lightlisterai.co.uk',
    siteName: 'LightLister AI',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}