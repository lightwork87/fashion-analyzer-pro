import { Inter } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Fashion Analyzer Pro - Professional eBay Listing Creator',
  description: 'AI-powered fashion analysis with professional dashboard, ruler detection, and subscription-based token system',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: 'light',
        variables: {
          colorPrimary: '#2563eb',
          colorBackground: '#ffffff',
          colorInputBackground: '#f8fafc',
          borderRadius: '8px'
        },
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
          card: 'shadow-xl border border-gray-200',
          headerTitle: 'text-blue-900 font-bold',
          headerSubtitle: 'text-gray-600'
        }
      }}
    >
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}