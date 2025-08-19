// app/account/page.js
// FIXED - Removed location reference

'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const { user } = useUser();
  const router = useRouter();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to view your account</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="mb-2"><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</p>
          <p className="mb-2"><strong>Name:</strong> {user.firstName} {user.lastName}</p>
          <p><strong>ID:</strong> {user.id}</p>
        </div>
      </div>
    </div>
  );
}