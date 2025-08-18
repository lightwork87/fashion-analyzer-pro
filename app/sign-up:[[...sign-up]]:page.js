// app/sign-up/[[...sign-up]]/page.js - COMPLETE FILE
import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <Sparkles className="h-10 w-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">LightLister AI</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Get 50 free credits when you sign up!
          </p>
        </div>

        {/* Clerk SignUp Component */}
        <SignUp 
          afterSignUpUrl="/dashboard"
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
          <span className="text-gray-600">Already have an account? </span>
          <Link href="/sign-in" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}