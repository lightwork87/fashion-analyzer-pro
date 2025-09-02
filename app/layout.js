import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import { CreditsProvider } from './contexts/CreditsContext';
import { ThemeProvider } from './contexts/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Fashion Analyzer Pro',
  description: 'AI-powered fashion item analysis and listing creation',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
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