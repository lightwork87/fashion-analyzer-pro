'use client';

import Link from 'next/link';
import { useUser, SignOutButton } from '@clerk/nextjs';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // Check for success parameter from Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      alert('Payment successful! Credits have been added to your account.');
      router.push('/dashboard');
    }
  }, [router]);

  const handleReportIssue = () => {
    window.location.href = 'mailto:lightlisterai@outlook.com?subject=LightLister%20AI%20-%20Issue%20Report';
  };

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
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                BETA VERSION
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {isLoaded && isSignedIn ? (
                <>
                  <Link 
                    href="/dashboard"
                    className="text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/beta"
                    className="text-sm bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Beta Program
                  </Link>
                  <Link 
                    href="/pricing"
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Get Credits
                  </Link>
                  <button
                    onClick={handleReportIssue}
                    className="text-sm bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Support
                  </button>
                  <div className="flex items-center gap-3 pl-3 border-l border-gray-300">
                    <span className="text-sm text-gray-600">
                      Hi, {user.firstName || user.emailAddresses[0].emailAddress}
                    </span>
                    <SignOutButton>
                      <button className="text-sm bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
                        Sign Out
                      </button>
                    </SignOutButton>
                  </div>
                </>
              ) : isLoaded ? (
                <>
                  <Link 
                    href="/beta"
                    className="text-sm bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Beta Program
                  </Link>
                  <Link 
                    href="/pricing"
                    className="text-sm bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    View Pricing
                  </Link>
                  <Link 
                    href="/sign-in" 
                    className="text-sm bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/sign-up" 
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              ) : null}
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
            List your fashion items on eBay and Vinted in seconds with AI-powered analysis
          </p>
          
          <div className="space-y-4">
            {isLoaded && isSignedIn ? (
              <>
                <Link 
                  href="/dashboard"
                  className="inline-block px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
                <p className="text-sm text-gray-600">
                  Start analyzing your fashion items now!
                </p>
              </>
            ) : isLoaded ? (
              <>
                <Link 
                  href="/sign-up"
                  className="inline-block px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Start Free Trial - 10 Credits
                </Link>
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/sign-in" className="text-blue-600 hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            ) : (
              <div className="inline-block px-8 py-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            )}
            
            <br />
            
            <Link 
              href="/pricing"
              className="inline-block px-8 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              View Pricing Plans
            </Link>
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
              Optimized for eBay and Vinted with platform-specific keywords
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
          <h3 className="text-2xl font-bold text-center mb-8">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold mb-2">Upload Photos</h4>
              <p className="text-sm text-gray-600">
                Take photos of your fashion items and upload them to our platform
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h4 className="font-semibold mb-2">AI Analysis</h4>
              <p className="text-sm text-gray-600">
                Our AI identifies brands, sizes, conditions, and suggests pricing
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h4 className="font-semibold mb-2">Edit & Optimize</h4>
              <p className="text-sm text-gray-600">
                Review and edit AI-generated listings with UK-specific details
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">4</span>
              </div>
              <h4 className="font-semibold mb-2">List & Sell</h4>
              <p className="text-sm text-gray-600">
                Post directly to eBay and Vinted with optimized titles and descriptions
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links for Logged In Users */}
        {isLoaded && isSignedIn && (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/dashboard"
                className="block bg-white border border-blue-300 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-blue-600 mb-2">Start Listing</h4>
                <p className="text-sm text-gray-600">
                  Upload photos and create your first listing
                </p>
              </Link>
              
              <Link
                href="/pricing"
                className="block bg-white border border-blue-300 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-blue-600 mb-2">Get More Credits</h4>
                <p className="text-sm text-gray-600">
                  Purchase credits to list more items
                </p>
              </Link>
              
              <Link
                href="/beta"
                className="block bg-white border border-blue-300 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-blue-600 mb-2">Join Beta Program</h4>
                <p className="text-sm text-gray-600">
                  Get 50 free credits and early access
                </p>
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-600">
          <p>&copy; 2025 LightLister AI. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/terms" className="hover:text-gray-900">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
            <button onClick={handleReportIssue} className="hover:text-gray-900">
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}