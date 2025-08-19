'use client';

import { useEffect, useState } from 'react';

export default function ClerkTest() {
  const [clientSideKeys, setClientSideKeys] = useState({});

  useEffect(() => {
    // Check client-side environment variables
    setClientSideKeys({
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
      signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
      afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
      afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Clerk Environment Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables Status</h2>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Publishable Key:</span>
              <span className={clientSideKeys.publishableKey ? 'text-green-600' : 'text-red-600'}>
                {clientSideKeys.publishableKey ? `✅ ${clientSideKeys.publishableKey.substring(0, 20)}...` : '❌ Missing'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Sign In URL:</span>
              <span className={clientSideKeys.signInUrl ? 'text-green-600' : 'text-red-600'}>
                {clientSideKeys.signInUrl || '❌ Missing'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Sign Up URL:</span>
              <span className={clientSideKeys.signUpUrl ? 'text-green-600' : 'text-red-600'}>
                {clientSideKeys.signUpUrl || '❌ Missing'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>After Sign In URL:</span>
              <span className={clientSideKeys.afterSignInUrl ? 'text-green-600' : 'text-red-600'}>
                {clientSideKeys.afterSignInUrl || '❌ Missing'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>After Sign Up URL:</span>
              <span className={clientSideKeys.afterSignUpUrl ? 'text-green-600' : 'text-red-600'}>
                {clientSideKeys.afterSignUpUrl || '❌ Missing'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Navigation</h2>
          <div className="grid grid-cols-2 gap-4">
            <a 
              href="/sign-in" 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700 transition"
            >
              Test Sign In Page
            </a>
            <a 
              href="/sign-up" 
              className="px-6 py-3 bg-green-600 text-white rounded-lg text-center hover:bg-green-700 transition"
            >
              Test Sign Up Page
            </a>
            <a 
              href="/dashboard" 
              className="px-6 py-3 bg-purple-600 text-white rounded-lg text-center hover:bg-purple-700 transition"
            >
              Test Dashboard (Protected)
            </a>
            <a 
              href="/" 
              className="px-6 py-3 bg-gray-600 text-white rounded-lg text-center hover:bg-gray-700 transition"
            >
              Back to Home
            </a>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> If keys are missing, check Vercel environment variables and ensure they are set for the production environment.
          </p>
        </div>
      </div>
    </div>
  );
}