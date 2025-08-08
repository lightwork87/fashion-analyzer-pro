import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'

export const metadata = {
  title: 'Fashion Analyzer Pro - AI-Powered Fashion Analysis',
  description: 'Analyze fashion items with AI for optimal eBay reselling',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}