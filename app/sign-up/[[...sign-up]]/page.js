// app/sign-up/[[...sign-up]]/page.js
// COMPLETE FILE - Copy this entire file

'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Start Your Free Trial
          </h1>
          <p className="text-gray-600">
            Join thousands creating professional listings with AI
          </p>
          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              🎉 Get 10 free credits to start!
            </p>
          </div>
        </div>
        
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              formButtonPrimary: 
                "bg-indigo-600 hover:bg-indigo-700 text-white transition-colors",
              formFieldInput: 
                "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
              footerActionLink: 
                "text-indigo-600 hover:text-indigo-800 font-medium",
              identityPreviewEditButton:
                "text-indigo-600 hover:text-indigo-800",
              formResendCodeLink:
                "text-indigo-600 hover:text-indigo-800"
            },
            layout: {
              socialButtonsPlacement: 'bottom',
              socialButtonsVariant: 'blockButton'
            }
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          redirectUrl="/dashboard"
        />
        
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Already have an account?</p>
          <a href="/sign-in" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Sign in instead
          </a>
        </div>
        
        <div className="mt-6 text-xs text-center text-gray-500">
          By signing up, you agree to our{' '}
          <a href="/terms" className="underline hover:text-gray-700">Terms</a> and{' '}
          <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}