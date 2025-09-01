// app/sign-in/[[...sign-in]]/page.js
'use client';

import { SignIn } from '@clerk/nextjs';

SignInPage() {
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
        
        <SignIn />
        
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

export default SignInPage;