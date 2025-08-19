'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import SignOutButton from './SignOutButton';
import CreditsDisplay from './CreditsDisplay';
import ThemeToggle from './ThemeToggle';

export default function Navigation() {
  const { user } = useUser();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-black font-bold text-sm">LL</span>
              </div>
              <h1 className="text-xl font-bold dark:text-white">LightLister AI</h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <CreditsDisplay />
            <ThemeToggle />
            {user && (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {user.firstName || user.emailAddresses?.[0]?.emailAddress}
                </span>
                <SignOutButton />
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}