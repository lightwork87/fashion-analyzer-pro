'use client';

export default function ClerkTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Clerk Environment Test</h1>
      <div className="space-y-2 font-mono text-sm">
        <p>Publishable Key: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}</p>
        <p>Key Prefix: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10)}...</p>
        <p>Sign In URL: {process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '❌ Missing'}</p>
        <p>Sign Up URL: {process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '❌ Missing'}</p>
      </div>
      <div className="mt-8 space-x-4">
        <a href="/sign-in" className="px-4 py-2 bg-blue-500 text-white rounded inline-block">
          Go to Sign In
        </a>
        <a href="/sign-up" className="px-4 py-2 bg-green-500 text-white rounded inline-block">
          Go to Sign Up
        </a>
      </div>
    </div>
  );
}