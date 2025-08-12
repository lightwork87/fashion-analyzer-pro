'use client';

import Link from 'next/link';
import { useUser, SignOutButton } from '@clerk/nextjs';
import Image from 'next/image';

export default function Home() {
  const { user, isLoaded } = useUser();

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/logo.png" 
                alt="Fashion Analyzer Pro" 
                width={40} 
                height={40}
                className="h-10 w-auto"
              />
              <h1 className="text-2xl font-bold text-gray-900">Fashion Analyzer Pro</h1>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                AI Powered
              </span>
            </div>
            <div>
              {isLoaded && user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Hi, {user.firstName || user.emailAddresses[0].emailAddress}</span>
                  <SignOutButton>
                    <button className="text-sm text-gray-600 hover:text-gray-900">
                      Sign Out
                    </button>
                  </SignOutButton>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Link href="/sign-in" className="text-sm text-gray-600 hover:text-gray-900">
                    Sign In
                  </Link>
                  <Link href="/sign-up" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <Image 
            src="/logo.png" 
            alt="Fashion Analyzer Pro" 
            width={80} 
            height={80}
            className="h-20 w-auto mx-auto mb-6"
          />
          <h2 className="text-3xl font-bold mb-4">
            AI-Powered Fashion Analysis for UK Resellers
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Analyze fashion items with AI to maximize your eBay & Vinted profits
          </p>
          
          <div className="space-y-4">
            {isLoaded && user ? (
              <Link 
                href="/dashboard"
                className="inline-block px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/sign-up"
                  className="inline-block px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Start Free Trial - 10 Credits
                </Link>
                <p className="text-sm text-gray-600">
                  Already have an account? <Link href="/sign-in" className="text-blue-600 hover:underline">Sign in</Link>
                </p>
              </>
            )}
            
            <br />
            
            <Link 
              href="/pricing"
              className="inline-block px-8 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              View Pricing Plans
            </Link>
          </div>
          
          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              🚧 Note: We&apos;re currently in beta. Start with 10 free credits!
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-blue-600 mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
            <p className="text-gray-600">
              Advanced AI identifies brands, sizes, conditions, and estimates values
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-green-600 mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Pricing</h3>
            <p className="text-gray-600">
              Get optimal pricing suggestions based on market data and condition
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-purple-600 mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Multi-Platform</h3>
            <p className="text-gray-600">
              Optimized for eBay & Vinted with platform-specific keywords
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}