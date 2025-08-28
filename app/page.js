'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LL</span>
              </div>
              <h1 className="text-xl font-bold">LightLister AI</h1>
            </div>
            
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-black">
                Dashboard
              </Link>
              <Link href="/sign-in" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Create Perfect eBay & Vinted Listings in Seconds
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI-powered listing creator for UK resellers. Upload photos, get optimized titles, 
            descriptions, and pricing instantly.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Go to Dashboard
            </Link>
            <Link 
              href="/sign-up"
              className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Sell Faster
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📸</span>
              </div>
              <h4 className="text-xl font-semibold mb-2 text-center">AI Photo Analysis</h4>
              <p className="text-gray-600 text-center">
                Upload photos and our AI identifies brands, sizes, materials, and conditions
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✍️</span>
              </div>
              <h4 className="text-xl font-semibold mb-2 text-center">Perfect Titles</h4>
              <p className="text-gray-600 text-center">
                Generate SEO-optimized titles for eBay (80 chars) and Vinted automatically
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💷</span>
              </div>
              <h4 className="text-xl font-semibold mb-2 text-center">Smart Pricing</h4>
              <p className="text-gray-600 text-center">
                Get pricing suggestions based on real UK market data and sold listings
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-3xl font-bold mb-4">
            Ready to 10x Your Listing Speed?
          </h3>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of UK sellers saving hours every week
          </p>
          <Link 
            href="/sign-up"
            className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 inline-block"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              © 2025 LightLister AI. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-gray-600 hover:text-black">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-black">
                Terms
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-black">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
