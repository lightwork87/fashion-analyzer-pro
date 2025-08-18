// app/layout.js - COMPLETE FILE WITH CREDITS DISPLAY
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import Header from '@/app/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'LightLister AI - AI-Powered eBay & Vinted Listing Creator',
  description: 'Create professional eBay and Vinted listings in seconds with AI-powered photo analysis',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Header />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}