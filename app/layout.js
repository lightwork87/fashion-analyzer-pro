import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import Navigation from './components/Navigation'
import CreditDisplay from './components/GlobalCreditDisplay'

export const metadata = {
  title: 'LightLister AI - AI-Powered Fashion Listing Tool',
  description: 'Create professional eBay and Vinted listings in seconds with AI',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Navigation />
          <CreditDisplay />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}