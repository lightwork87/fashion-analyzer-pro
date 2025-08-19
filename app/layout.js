import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'LightLister AI - AI-Powered eBay & Vinted Listing Creator',
  description: 'Create perfect eBay and Vinted listings in seconds with AI.',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      domain={null}  // Force default Clerk domain
      isSatellite={false}
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