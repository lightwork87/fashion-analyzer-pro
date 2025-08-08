import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Fashion Analyzer Pro - AI-Powered Fashion Analysis',
  description: 'Analyze fashion items with AI for optimal eBay reselling',
  keywords: 'fashion, AI, analysis, eBay, reselling, clothing',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}