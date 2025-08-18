// app/page.js - COMPLETE HOMEPAGE
'use client';

import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';
import { Camera, Package, Zap, CreditCard, BarChart3, CheckCircle, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              List Fashion Items in Seconds
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              AI-powered listing creation for eBay UK and Vinted. Upload photos, get professional listings with accurate pricing instantly.
            </p>
            
            {/* CTA Buttons */}
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 flex items-center"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </SignedIn>
              
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-700">
                    Get Started Free
                  </button>
                </SignInButton>
                <Link
                  href="/sign-up"
                  className="text-lg font-semibold leading-6 text-gray-900 hover:text-gray-700"
                >
                  Sign Up <span aria-hidden="true">→</span>
                </Link>
              </SignedOut>
            </div>

            {/* Beta Offer */}
            <div className="mt-8 inline-flex items-center rounded-full bg-green-100 px-4 py-2">
              <span className="text-sm font-medium text-green-800">
                🎉 Beta Offer: Get 50 free credits (worth £12.50) when you sign up!
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600">Three simple steps to professional listings</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Camera className="h-8 w-8" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">1. Upload Photos</h3>
              <p className="mt-2 text-gray-600">
                Take photos of your fashion items. Upload up to 24 photos per item for best results.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">2. AI Analysis</h3>
              <p className="mt-2 text-gray-600">
                Our AI detects brands, sizes, conditions, and suggests optimal pricing based on UK market data.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Package className="h-8 w-8" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">3. List & Sell</h3>
              <p className="mt-2 text-gray-600">
                Get optimized listings for eBay UK and Vinted. Copy and paste or use our direct integration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Built for UK Fashion Resellers
              </h2>
              <div className="mt-8 space-y-6">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">UK Brand Detection</h3>
                    <p className="text-gray-600">Recognizes popular UK high street and designer brands</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">Accurate UK Sizing</h3>
                    <p className="text-gray-600">Converts sizes correctly for UK, EU, and US markets</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">Market-Based Pricing</h3>
                    <p className="text-gray-600">Suggests prices based on current UK market trends</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">Platform Optimization</h3>
                    <p className="text-gray-600">Tailored listings for eBay UK and Vinted requirements</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Features Include:</h3>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 mr-3" />
                  <span>Single item or bulk analysis (up to 25 items)</span>
                </li>
                <li className="flex items-center">
                  <CreditCard className="h-5 w-5 text-blue-600 mr-3" />
                  <span>Pay-as-you-go credits system</span>
                </li>
                <li className="flex items-center">
                  <Package className="h-5 w-5 text-blue-600 mr-3" />
                  <span>Inventory management dashboard</span>
                </li>
                <li className="flex items-center">
                  <Zap className="h-5 w-5 text-blue-600 mr-3" />
                  <span>SEO-optimized titles under 80 characters</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Start Listing Smarter?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Join hundreds of UK resellers saving hours on every listing
          </p>
          <div className="mt-8">
            <SignedIn>
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-md bg-white px-6 py-3 text-lg font-semibold text-blue-600 shadow-sm hover:bg-gray-100"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </SignedIn>
            
            <SignedOut>
              <SignInButton mode="modal">
                <button className="inline-flex items-center rounded-md bg-white px-6 py-3 text-lg font-semibold text-blue-600 shadow-sm hover:bg-gray-100">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 LightLister AI. All rights reserved.</p>
            <div className="mt-4 space-x-6">
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white">Terms of Service</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}