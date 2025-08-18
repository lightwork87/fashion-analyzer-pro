// app/page.js - COMPLETE FILE WITH NAVIGATION
'use client';

import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Sparkles, 
  Camera, 
  Package, 
  Zap, 
  CreditCard, 
  BarChart3, 
  CheckCircle, 
  ArrowRight 
} from 'lucide-react';

export default function Home() {
  const { user, isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (isSignedIn) {
      fetchCredits();
    }
  }, [isSignedIn]);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data.creditsAvailable || 0);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Sparkles className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">LightLister AI</span>
                <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-600">
                  BETA
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900">
                Home
              </Link>
              <Link href="#features" className="text-gray-700 hover:text-gray-900">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-700 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/dashboard/help" className="text-gray-700 hover:text-gray-900">
                Help
              </Link>
            </div>

            {/* Right side - Credits and User */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <SignedIn>
                {/* Credits Display */}
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1.5">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">{credits} Credits</span>
                </div>
                
                {/* Dashboard Link */}
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900 font-medium"
                >
                  Dashboard
                </Link>
                
                {/* User Button */}
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-gray-700 hover:text-gray-900 font-medium">
                    Sign In
                  </button>
                </SignInButton>
                <Link
                  href="/sign-up"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Get Started
                </Link>
              </SignedOut>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-700"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="space-y-1 pb-3 pt-2">
                <Link
                  href="/"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="#features"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="#pricing"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                
                <SignedIn>
                  <div className="border-t pt-2">
                    <div className="px-3 py-2">
                      <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">{credits} Credits</span>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <div className="px-3 py-2">
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  </div>
                </SignedIn>
                
                <SignedOut>
                  <div className="border-t pt-2">
                    <SignInButton mode="modal">
                      <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">
                        Sign In
                      </button>
                    </SignInButton>
                    <Link
                      href="/sign-up"
                      className="block px-3 py-2 text-base font-medium text-blue-600 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </div>
                </SignedOut>
              </div>
            </div>
          )}
        </nav>
      </header>

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
      <section id="features" className="py-20 bg-gray-50">
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

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Simple Pricing</h2>
            <p className="mt-4 text-lg text-gray-600">Pay as you go - no subscriptions</p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-500">
              <h3 className="text-2xl font-bold text-gray-900">Credits System</h3>
              <p className="mt-4 text-gray-600">1 credit = 1 item analysis</p>
              
              <div className="mt-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">10 credits</span>
                  <span className="font-semibold">£10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">50 credits</span>
                  <span className="font-semibold">£45 (Save 10%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">100 credits</span>
                  <span className="font-semibold">£80 (Save 20%)</span>
                </div>
              </div>

              <div className="mt-8">
                <SignedIn>
                  <Link
                    href="/dashboard/get-credits"
                    className="w-full block text-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
                  >
                    Buy Credits
                  </Link>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                      Sign Up to Buy Credits
                    </button>
                  </SignInButton>
                </SignedOut>
              </div>
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