'use client';

import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function SignOutButton({ className = '', children = 'Sign Out' }) {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <button
      onClick={handleSignOut}
      className={className || "px-4 py-2 text-sm text-gray-600 hover:text-black"}
    >
      {children}
    </button>
  );
}