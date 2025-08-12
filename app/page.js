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
                alt="LightLister AI" 
                width={40} 
                height={40}
                className="h-10 w-auto"
              />
              <h1 className="text-2xl font-bold text-gray-900">LightLister AI</h1>
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
            alt="LightLister AI" 
            width={80} 
            height={80}
            className="h-20 w-auto mx-auto mb-6"
          />
          <h2 className="text-3xl font-bold mb-4">
            AI-Powered Fashion Listing for UK Resellers
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            List your fashion items on eBay & Vinted in seconds with AI-powered analysis
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

        {/* Beta Testing Program Banner */}
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-lg font-semibold">Beta Testing Program Open!</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Join our beta program and get 50 free credits (worth £12.50) to test all features!
          </p>
          <Link 
            href="/beta"
            className="inline-block px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Apply for Beta Access
          </Link>
        </div>

        {/* How It Works Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">How LightLister AI Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold mb-2">Upload Photos</h4>
              <p className="text-sm text-gray-600">
                Take photos of your items - up to 24 per listing
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h4 className="font-semibold mb-2">AI Analysis</h4>
              <p className="text-sm text-gray-600">
                Our AI identifies brands, sizes, and conditions
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h4 className="font-semibold mb-2">Review & Edit</h4>
              <p className="text-sm text-gray-600">
                Fine-tune AI suggestions and pricing
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">4</span>
              </div>
              <h4 className="font-semibold mb-2">List & Sell</h4>
              <p className="text-sm text-gray-600">
                Export to eBay, Vinted, or other platforms
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials Section (Coming Soon) */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Coming Soon: Success Stories</h2>
          <p className="text-gray-600 mb-6">
            Be one of our first beta testers and have your success story featured here!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg">
              <div className="text-4xl mb-4">⭐⭐⭐⭐⭐</div>
              <p className="text-sm text-gray-600 italic">
                "Your testimonial could be here!"
              </p>
              <p className="text-sm font-semibold mt-2">Beta Tester</p>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <div className="text-4xl mb-4">⭐⭐⭐⭐⭐</div>
              <p className="text-sm text-gray-600 italic">
                "Join beta testing today"
              </p>
              <p className="text-sm font-semibold mt-2">Beta Tester</p>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <div className="text-4xl mb-4">⭐⭐⭐⭐⭐</div>
              <p className="text-sm text-gray-600 italic">
                "Share your experience"
              </p>
              <p className="text-sm font-semibold mt-2">Beta Tester</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-600">
          <p>&copy; 2025 LightLister AI. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/terms" className="hover:text-gray-900">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-gray-900">Contact Us</Link>
          </div>
        </div>
      </div>
    </main>
  );
}