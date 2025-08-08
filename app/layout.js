import './globals.css'
import dynamic from 'next/dynamic'

const ErrorBoundary = dynamic(() => import('./components/ErrorBoundary'), {
  ssr: false
})

export const metadata = {
  title: 'Fashion Analyzer Pro - AI-Powered Fashion Analysis',
  description: 'Analyze fashion items with AI for optimal eBay reselling',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}