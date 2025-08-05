import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Fashion Analyzer Pro - AI-Powered eBay Listing Creation',
  description: 'Professional eBay listing creation with AI-powered analysis, ruler measurements, and condition assessment.',
  keywords: 'eBay, fashion, AI, listing, analyzer, measurements, condition assessment',
  authors: [{ name: 'Fashion Analyzer Pro' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#2563eb',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#1f2937',
          colorTextOnPrimaryBackground: '#ffffff',
          colorTextSecondary: '#6b7280',
          colorSuccess: '#10b981',
          colorDanger: '#ef4444',
          colorWarning: '#f59e0b',
          colorNeutral: '#6b7280',
          borderRadius: '0.5rem',
          fontFamily: inter.style.fontFamily,
          fontSize: '0.875rem',
          fontWeight: '400'
        },
        elements: {
          formButtonPrimary: {
            backgroundColor: '#2563eb',
            '&:hover': {
              backgroundColor: '#1d4ed8'
            }
          },
          card: {
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
          },
          headerTitle: {
            color: '#1f2937',
            fontSize: '1.5rem',
            fontWeight: '700'
          },
          headerSubtitle: {
            color: '#6b7280',
            fontSize: '0.875rem'
          },
          socialButtonsBlockButton: {
            borderRadius: '0.5rem',
            borderColor: '#e5e7eb',
            '&:hover': {
              backgroundColor: '#f9fafb'
            }
          },
          formFieldInput: {
            borderRadius: '0.5rem',
            borderColor: '#d1d5db',
            '&:focus': {
              borderColor: '#2563eb',
              boxShadow: '0 0 0 3px rgb(37 99 235 / 0.1)'
            }
          },
          footerActionLink: {
            color: '#2563eb',
            '&:hover': {
              color: '#1d4ed8'
            }
          }
        }
      }}
    >
      <html lang="en" className={inter.className}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#2563eb" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body className={`${inter.className} bg-gray-50 antialiased`}>
          <div id="root" className="min-h-screen">
            {children}
          </div>
          
          {/* Performance and Analytics Scripts */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Performance monitoring
                if (typeof window !== 'undefined') {
                  window.addEventListener('load', function() {
                    // Log performance metrics
                    setTimeout(function() {
                      const perfData = performance.getEntriesByType('navigation')[0];
                      if (perfData) {
                        console.log('Page Load Performance:', {
                          loadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
                          domReady: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
                          firstPaint: Math.round(perfData.responseStart - perfData.fetchStart)
                        });
                      }
                    }, 100);
                  });
                  
                  // Error boundary for unhandled errors
                  window.addEventListener('error', function(e) {
                    console.error('Global error caught:', e.error);
                  });
                  
                  window.addEventListener('unhandledrejection', function(e) {
                    console.error('Unhandled promise rejection:', e.reason);
                  });
                }
              `
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}