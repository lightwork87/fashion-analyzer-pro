// app/components/Header.js - FIXED VERSION
'use client';

import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, CreditCard, Sparkles } from 'lucide-react'; // Added Sparkles import!

export default function Header() {
  const { user, isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (isSignedIn) {
      fetchCredits();
    }
  }, [isSignedIn]);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data.creditsAvailable || 0);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">LightLister AI</span>
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-600">
                BETA
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link href="/" className="text-gray-700 hover:text-gray-900">
              Home
            </Link>
            <Link href="/features" className="text-gray-700 hover:text-gray-900">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/dashboard/help" className="text-gray-700 hover:text-gray-900">
              Help
            </Link>
          </div>

          {/* Right side - Credits and User */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <SignedIn>
              {/* Credits Display */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1.5">
                <CreditCard className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">{credits} Credits</span>
              </div>
              
              {/* Dashboard Link */}
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Dashboard
              </Link>
              
              {/* User Button */}
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-gray-700 hover:text-gray-900 font-medium">
                  Sign In
                </button>
              </SignInButton>
              <Link
                href="/sign-up"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Get Started
              </Link>
            </SignedOut>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 pb-3 pt-2">
              <Link
                href="/"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Home
              </Link>
              <Link
                href="/features"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Pricing
              </Link>
              
              <SignedIn>
                <div className="border-t pt-2">
                  <div className="px-3 py-2">
                    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                      <CreditCard className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">{credits} Credits</span>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Dashboard
                  </Link>
                  <div className="px-3 py-2">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </div>
              </SignedIn>
              
              <SignedOut>
                <div className="border-t pt-2">
                  <SignInButton mode="modal">
                    <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">
                      Sign In
                    </button>
                  </SignInButton>
                  <Link
                    href="/sign-up"
                    className="block px-3 py-2 text-base font-medium text-blue-600 hover:bg-gray-50"
                  >
                    Get Started
                  </Link>
                </div>
              </SignedOut>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}