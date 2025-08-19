'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-black font-bold text-lg">LL</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your LightLister AI account</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Start creating perfect listings in seconds</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">🎁 Get 5 free credits when you sign up!</p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl border-0",
              formFieldInput: "!text-black !bg-white",
              formFieldLabel: "!text-gray-700",
              formButtonPrimary: "bg-black hover:bg-gray-800",
              footerActionLink: "text-black hover:text-gray-700"
            }
          }}
        />
      </div>
    </div>
  );
}