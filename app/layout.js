// app/layout.js - Replace your current ClerkProvider with this
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { CreditsProvider } from './contexts/CreditsContext';
import { ThemeProvider } from './contexts/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'LightLister AI - AI-Powered eBay & Vinted Listing Creator',
  description: 'Create perfect eBay and Vinted listings in seconds with AI.',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      domain={undefined}  // Explicitly undefined
      isSatellite={false}  // Disable satellite
      sdkMetadata={{
        host: window?.location?.host || 'lightlisterai.co.uk',
        protocol: 'https',
        name: '@clerk/nextjs',
      }}
    >
      <html lang="en">
        <body className={inter.className}>
          <ThemeProvider>
            <CreditsProvider>
              {children}
            </CreditsProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}