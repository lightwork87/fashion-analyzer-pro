// app/sign-in/[[...sign-in]]/page.js
// REPLACE YOUR CURRENT FILE WITH THIS SIMPLER VERSION

'use client';

import { SignIn } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function SignInPage() {
  const [clerkLoaded, setClerkLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if Clerk is available
    const checkClerk = () => {
      if (typeof window !== 'undefined') {
        if (window.Clerk) {
          setClerkLoaded(true);
        } else {
          const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
          if (!key) {
            setError('Missing publishable key');
          } else if (key.includes('example')) {
            setError('Using example key - need real key from Clerk Dashboard');
          } else {
            setError('Clerk not loading - check your configuration');
          }
        }
      }
    };

    checkClerk();
    const timer = setTimeout(checkClerk, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back to LightLister AI
          </h1>
          <p className="text-gray-600">
            Sign in to continue creating amazing listings
          </p>
        </div>
        
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold mb-3">Configuration Error:</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="bg-white rounded p-4 text-sm text-gray-700 space-y-2">
              <p className="font-semibold">To fix this:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to <a href="https://dashboard.clerk.com" target="_blank" className="text-blue-600 underline">dashboard.clerk.com</a></li>
                <li>Find your app (create one if needed)</li>
                <li>Copy your publishable key (starts with pk_live_ or pk_test_)</li>
                <li>Update NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in .env.local</li>
                <li>Restart your dev server</li>
              </ol>
            </div>
            <div className="mt-4">
              <a 
                href="/clerk-debug" 
                className="block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                View Debug Info →
              </a>
            </div>
          </div>
        ) : clerkLoaded ? (
          <SignIn 
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
          />
        ) : (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading authentication...</p>
          </div>
        )}
        
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Don't have an account?</p>
          <a href="/sign-up" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Sign up for free
          </a>
        </div>
      </div>
    </div>
  );
}