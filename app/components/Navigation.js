'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser, SignOutButton } from '@clerk/nextjs';
import CreditDisplay from './CreditDisplay';

export default function Navigation() {
  const { user, isLoaded, isSignedIn } = useUser();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="LightLister AI" 
                width={32} 
                height={32}
                className="h-8 w-auto mr-3"
              />
              <h1 className="text-xl font-bold text-gray-900">LightLister AI</h1>
            </Link>
            <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
              BETA
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {isLoaded && isSignedIn ? (
              <>
                <CreditDisplay />
                <Link 
                  href="/"
                  className="text-sm bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Home
                </Link>
                <Link 
                  href="/dashboard"
                  className="text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/beta"
                  className="text-sm bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  Beta
                </Link>
                <Link 
                  href="/pricing"
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Get Credits
                </Link>
                <SignOutButton>
                  <button className="text-sm bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                    Sign Out
                  </button>
                </SignOutButton>
              </>
            ) : isLoaded ? (
              <>
                <Link 
                  href="/"
                  className="text-sm bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Home
                </Link>
                <Link 
                  href="/sign-in"
                  className="text-sm bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Sign In
                </Link>
                <Link 
                  href="/sign-up"
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Get Started
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}