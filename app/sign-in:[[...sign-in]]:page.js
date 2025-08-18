// app/sign-in/[[...sign-in]]/page.js - COMPLETE FILE
import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <Sparkles className="h-10 w-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">LightLister AI</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Clerk SignIn Component */}
        <SignIn 
          afterSignInUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-none",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
            }
          }}
        />

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <Link href="/sign-up" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}