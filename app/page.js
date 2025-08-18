// app/page.js
// UPDATED HOMEPAGE WITH NAVIGATION

'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowRight, DollarSign, Package, Zap, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function HomePage() {
  const { isSignedIn, isLoaded } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">LL</span>
              </div>
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">LightLister AI</h1>
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  BETA VERSION
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/features" className="text-gray-600 hover:text-gray-900">
                Features
              </Link>
              {isLoaded && (
                <>
                  {isSignedIn ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="px-4 py-2 text-gray-700 hover:text-gray-900"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        My Account
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/sign-in"
                        className="px-4 py-2 text-gray-700 hover:text-gray-900"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/sign-up"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </>
              )}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t">
              <div className="flex flex-col gap-2">
                <Link href="/pricing" className="px-4 py-2 text-gray-600 hover:text-gray-900">
                  Pricing
                </Link>
                <Link href="/features" className="px-4 py-2 text-gray-600 hover:text-gray-900">
                  Features
                </Link>
                {isLoaded && (
                  <>
                    {isSignedIn ? (
                      <>
                        <Link
                          href="/dashboard"
                          className="px-4 py-2 text-gray-700 hover:text-gray-900"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/dashboard/settings"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block text-center"
                        >
                          My Account
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/sign-in"
                          className="px-4 py-2 text-gray-700 hover:text-gray-900"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/sign-up"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block text-center"
                        >
                          Get Started
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gray-900 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-2xl">LL</span>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Fashion Listing for UK Resellers
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            List your fashion items on eBay and Vinted in seconds with AI-powered analysis
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <Link
                    href="/dashboard"
                    className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/sign-up"
                      className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      Start Free Trial
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                      href="/sign-in"
                      className="px-8 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Analysis</h3>
              <p className="text-gray-600">
                Advanced AI identifies brands, sizes, conditions, and estimates values
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Pricing</h3>
              <p className="text-gray-600">
                Get optimal pricing suggestions based on market data and condition
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-Platform</h3>
              <p className="text-gray-600">
                Optimized for eBay and Vinted with platform-specific keywords
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Beta Program Section */}
      <section className="py-20 px-4 bg-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚀</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Beta Testing Program Open!
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join our beta program and get 50 free credits (worth £12.50) to test all features!
          </p>
          {isLoaded && !isSignedIn && (
            <Link
              href="/sign-up"
              className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center gap-2"
            >
              Join Beta Program
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}