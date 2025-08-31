// app/clerk-debug/page.js
// CREATE THIS FILE to debug Clerk issues

'use client';

import { useEffect, useState } from 'react';

export default function ClerkDebugPage() {
  const [clerkStatus, setClerkStatus] = useState('Checking...');
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    // Check if Clerk is loaded
    const checkClerk = () => {
      const info = {
        publicKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'NOT SET',
        hasClerk: typeof window !== 'undefined' && window.Clerk ? 'YES' : 'NO',
        clerkVersion: typeof window !== 'undefined' && window.Clerk?.version || 'NOT LOADED',
        signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || 'NOT SET',
        signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || 'NOT SET',
        afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || 'NOT SET',
        afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || 'NOT SET',
      };

      // Check the publishable key format
      const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
      if (key.includes('example')) {
        info.keyError = '❌ KEY CONTAINS "example" - THIS IS NOT A REAL KEY!';
      } else if (key.length < 50) {
        info.keyError = '❌ KEY TOO SHORT - Should be 50+ characters';
      } else if (!key.startsWith('pk_')) {
        info.keyError = '❌ KEY SHOULD START WITH pk_live_ or pk_test_';
      } else {
        info.keyError = '✅ Key format looks valid';
      }

      setDebugInfo(info);

      // Try to load Clerk manually
      if (typeof window !== 'undefined' && !window.Clerk) {
        setClerkStatus('❌ Clerk not loaded - Check your publishable key');
      } else if (window.Clerk) {
        setClerkStatus('✅ Clerk is loaded');
      }
    };

    checkClerk();
    
    // Check again after a delay
    const timer = setTimeout(checkClerk, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Clerk Debug Information</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status: {clerkStatus}</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Environment Variables:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">What to check:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to https://dashboard.clerk.com</li>
                <li>Find your app (NOT example.co.uk)</li>
                <li>Copy the REAL publishable key (starts with pk_live_ or pk_test_)</li>
                <li>Update your .env.local file</li>
                <li>Restart your dev server: npm run dev</li>
              </ol>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Common Issues:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Using example.co.uk placeholder key</li>
                <li>Missing NEXT_PUBLIC_ prefix on env variables</li>
                <li>Not restarting server after changing .env.local</li>
                <li>Custom domain configuration in Clerk Dashboard</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions:</h2>
          <div className="space-y-3">
            <a 
              href="https://dashboard.clerk.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
            >
              Open Clerk Dashboard →
            </a>
            <a 
              href="/sign-in" 
              className="block w-full text-center bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700"
            >
              Test Sign In Page →
            </a>
            <a 
              href="/sign-up" 
              className="block w-full text-center bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700"
            >
              Test Sign Up Page →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}