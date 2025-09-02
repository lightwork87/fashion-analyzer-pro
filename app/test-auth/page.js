'use client';

import { useUser, useAuth, SignInButton, SignOutButton } from '@clerk/nextjs';

export default function TestAuth() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { userId } = useAuth();

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Status:</h2>
        <p>Signed In: {isSignedIn ? '✅ Yes' : '❌ No'}</p>
        <p>User ID: {userId || 'None'}</p>
        <p>Email: {user?.emailAddresses?.[0]?.emailAddress || 'None'}</p>
      </div>

      <div className="space-x-4">
        {isSignedIn ? (
          <SignOutButton>
            <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              Sign Out
            </button>
          </SignOutButton>
        ) : (
          <SignInButton mode="modal">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Sign In
            </button>
          </SignInButton>
        )}
      </div>
    </div>
  );
}