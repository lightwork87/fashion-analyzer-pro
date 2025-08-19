import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'LightLister AI - AI-Powered eBay & Vinted Listing Creator',
  description: 'Create perfect eBay and Vinted listings in seconds with AI.',
};

export default function RootLayout({ children }) {
  // TEMPORARY: Hardcode your actual Clerk publishable key here
  // Replace this with your ACTUAL key from Clerk Dashboard
  const publishableKey = 'pk_live_Y2xlcmsubGlnaHRsaXN0ZXJhaS5jby51ayQ'; // <-- PUT YOUR REAL KEY HERE
  
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      appearance={{
        elements: {
          formButtonPrimary: 'bg-black hover:bg-gray-800 text-white',
          card: 'shadow-lg',
        },
      }}
    >
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}