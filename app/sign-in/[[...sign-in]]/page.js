'use client';

import { SignIn } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function SignInPage() {
  const [mounted, setMounted] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    setMounted(true);
    // Debug info
    setDebugInfo({
      hasKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      keyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10),
      signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    });
  }, []);

  // Show debug info if no key
  if (mounted && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Configuration Error</h2>
          <p className="text-gray-600 mb-4">Clerk is not properly configured.</p>
          <div className="bg-gray-100 p-4 rounded text-sm font-mono">
            <p>Key Status: {debugInfo.hasKey ? '✅ Found' : '❌ Missing'}</p>
            <p>Key Prefix: {debugInfo.keyPrefix || 'N/A'}</p>
            <p>Sign-in URL: {debugInfo.signInUrl || 'Not set'}</p>
          </div>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              Please ensure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set in Vercel environment variables.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">LL</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back to LightLister AI</h1>
          <p className="text-gray-600 mt-2">Sign in to your account to continue</p>
        </div>
        {mounted && (
          <SignIn 
            afterSignInUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        )}
      </div>
    </div>
  );
}