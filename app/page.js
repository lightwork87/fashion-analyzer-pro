// app/page.js - COMPLETE HOMEPAGE WITH ALL FEATURES
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
  ArrowRight,
  Upload,
  DollarSign,
  Clock,
  Shield,
  Star,
  Users
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
              <Link href="#features" className="text-gray-700 hover:text-gray-900">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-700 hover:text-gray-900">
                How It Works
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
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Go to Dashboard
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
                  Get Started Free
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
                  href="#features"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="#how-it-works"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
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
                      Go to Dashboard
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
                      Get Started Free
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
                  href="/dashboard/analyze-single"
                  className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 flex items-center"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Analyze Item Now
                </Link>
                <Link
                  href="/dashboard"
                  className="text-lg font-semibold leading-6 text-gray-900 hover:text-gray-700"
                >
                  Go to Dashboard <span aria-hidden="true">→</span>
                </Link>
              </SignedIn>
              
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 flex items-center">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Start Free Trial
                  </button>
                </SignInButton>
                <Link
                  href="/sign-up"
                  className="text-lg font-semibold leading-6 text-gray-900 hover:text-gray-700"
                >
                  Sign Up Free <span aria-hidden="true">→</span>
                </Link>
              </SignedOut>
            </div>

            {/* Beta Offer */}
            <div className="mt-8 inline-flex items-center rounded-full bg-green-100 px-4 py-2">
              <span className="text-sm font-medium text-green-800">
                🎉 Beta Offer: Get 50 free credits (worth £12.50) when you sign up!
              </span>
            </div>

            {/* Demo Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <p className="text-3xl font-bold text-blue-600">30s</p>
                <p className="text-sm text-gray-600">Average analysis time</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">95%</p>
                <p className="text-sm text-gray-600">Brand detection accuracy</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">£1</p>
                <p className="text-sm text-gray-600">Per listing cost</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How LightLister AI Works</h2>
            <p className="mt-4 text-lg text-gray-600">Three simple steps to professional listings</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Upload className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900">1. Upload Photos</h3>
                <p className="mt-2 text-gray-600">
                  Take photos of your fashion items. Upload up to 24 photos per item for best results.
                </p>
              </div>
              <div className="hidden md:block absolute top-8 left-full w-full">
                <ArrowRight className="h-6 w-6 text-gray-400 mx-auto" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900">2. AI Analysis</h3>
                <p className="mt-2 text-gray-600">
                  Our AI detects brands, sizes, conditions, and suggests optimal pricing based on UK market data.
                </p>
              </div>
              <div className="hidden md:block absolute top-8 left-full w-full">
                <ArrowRight className="h-6 w-6 text-gray-400 mx-auto" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Package className="h-8 w-8" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">3. List & Sell</h3>
              <p className="mt-2 text-gray-600">
                Get optimized listings for eBay UK and Vinted. Copy and paste or use our direct integration.
              </p>
            </div>
          </div>

          {/* Try it now button */}
          <div className="mt-12 text-center">
            <SignedIn>
              <Link
                href="/dashboard/analyze-single"
                className="inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Try It Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700">
                  Try It Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Built for UK Fashion Resellers
            </h2>
            <p className="mt-4 text-lg text-gray-600">Everything you need to list faster and sell more</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Camera className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Smart Photo Analysis</h3>
              <p className="mt-2 text-gray-600">
                Upload multiple photos and our AI analyzes every detail - brands, sizes, conditions, and unique features.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Market-Based Pricing</h3>
              <p className="mt-2 text-gray-600">
                Get accurate pricing suggestions based on current UK market trends and item condition.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Platform Optimization</h3>
              <p className="mt-2 text-gray-600">
                Tailored listings for eBay UK and Vinted with platform-specific keywords and formatting.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Bulk Processing</h3>
              <p className="mt-2 text-gray-600">
                Analyze up to 25 items at once. Perfect for processing your entire inventory quickly.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">UK Brand Database</h3>
              <p className="mt-2 text-gray-600">
                Recognizes popular UK high street and designer brands for accurate identification.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Inventory Dashboard</h3>
              <p className="mt-2 text-gray-600">
                Track all your listings, monitor performance, and manage your inventory in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-gray-600">Pay only for what you use</p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-8">
                <h3 className="text-2xl font-bold text-gray-900">Pay As You Go</h3>
                <p className="mt-4 text-gray-600">Perfect for resellers of all sizes</p>
                
                <div className="mt-6">
                  <p className="text-4xl font-bold text-gray-900">
                    £1
                    <span className="text-base font-normal text-gray-600">/credit</span>
                  </p>
                  <p className="mt-2 text-sm text-gray-600">1 credit = 1 item analysis</p>
                </div>

                <ul className="mt-8 space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span className="ml-3 text-gray-600">Analyze unlimited photos per item</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span className="ml-3 text-gray-600">eBay UK & Vinted optimized listings</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span className="ml-3 text-gray-600">Brand detection & pricing suggestions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span className="ml-3 text-gray-600">Inventory management dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span className="ml-3 text-gray-600">50 free credits for new users</span>
                  </li>
                </ul>

                <div className="mt-8">
                  <SignedIn>
                    <Link
                      href="/dashboard/get-credits"
                      className="block w-full text-center rounded-md bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                      Buy Credits
                    </Link>
                  </SignedIn>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="block w-full text-center rounded-md bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700">
                        Get Started
                      </button>
                    </SignInButton>
                  </SignedOut>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Packages */}
          <div className="mt-12 max-w-3xl mx-auto">
            <p className="text-center text-gray-600 mb-6">Popular credit packages:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="font-semibold text-gray-900">Starter</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">£10</p>
                <p className="text-sm text-gray-600">10 credits</p>
              </div>
              <div className="bg-white rounded-lg p-4 border-2 border-blue-500">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">Popular</p>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Best value</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">£25</p>
                <p className="text-sm text-gray-600">25 credits</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="font-semibold text-gray-900">Professional</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">£50</p>
                <p className="text-sm text-gray-600">50 credits</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Trusted by UK Resellers</h2>
            <p className="mt-4 text-lg text-gray-600">See what our beta users are saying</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex mb-4">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
              </div>
              <p className="text-gray-600 italic">
                "LightLister has transformed my eBay business. What used to take 20 minutes per listing now takes 2!"
              </p>
              <p className="mt-4 font-semibold text-gray-900">Sarah M.</p>
              <p className="text-sm text-gray-600">eBay PowerSeller</p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex mb-4">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
              </div>
              <p className="text-gray-600 italic">
                "The brand detection is incredibly accurate. It even recognizes vintage UK brands I didn't know!"
              </p>
              <p className="mt-4 font-semibold text-gray-900">James T.</p>
              <p className="text-sm text-gray-600">Vinted Seller</p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex mb-4">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
              </div>
              <p className="text-gray-600 italic">
                "The bulk upload feature is a game-changer. I processed 50 items in under an hour!"
              </p>
              <p className="mt-4 font-semibold text-gray-900">Emma R.</p>
              <p className="text-sm text-gray-600">Fashion Reseller</p>
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
                href="/dashboard/analyze-single"
                className="inline-flex items-center rounded-md bg-white px-6 py-3 text-lg font-semibold text-blue-600 shadow-sm hover:bg-gray-100"
              >
                Start Analyzing Now
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
          <p className="mt-4 text-sm text-blue-100">
            No credit card required • 50 free credits
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1 */}
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-blue-400" />
                <span className="text-white font-semibold">LightLister AI</span>
              </div>
              <p className="mt-4 text-sm text-gray-400">
                AI-powered listing creation for UK fashion resellers.
              </p>
            </div>

            {/* Column 2 */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">Dashboard</Link></li>
                <li><Link href="#features" className="text-gray-400 hover:text-white text-sm">Features</Link></li>
                <li><Link href="#pricing" className="text-gray-400 hover:text-white text-sm">Pricing</Link></li>
                <li><Link href="/dashboard/tutorial" className="text-gray-400 hover:text-white text-sm">Tutorial</Link></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/dashboard/help" className="text-gray-400 hover:text-white text-sm">Help Center</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white text-sm">Contact Us</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white text-sm">About Us</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white text-sm">Blog</Link></li>
                <li><a href="mailto:support@lightlisterai.co.uk" className="text-gray-400 hover:text-white text-sm">support@lightlisterai.co.uk</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              &copy; 2025 LightLister AI. All rights reserved. Made with ❤️ in the UK.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}