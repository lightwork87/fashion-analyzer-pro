'use client';

import Link from 'next/link';
import { UserButton, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { Home, Package, CreditCard, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                Fashion Analyzer Pro
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 flex items-center space-x-1">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            
            <SignedIn>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/dashboard/analyze-single" className="text-gray-700 hover:text-blue-600">
                Analyze
              </Link>
              <Link href="/dashboard/credits" className="text-gray-700 hover:text-blue-600 flex items-center space-x-1">
                <CreditCard className="h-4 w-4" />
                <span>Credits</span>
              </Link>
              <Link href="/dashboard/settings" className="text-gray-700 hover:text-blue-600 flex items-center space-x-1">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SignedIn>

            <Link href="/pricing" className="text-gray-700 hover:text-blue-600">
              Pricing
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-gray-700 hover:text-blue-600 font-medium">
                  Sign In
                </button>
              </SignInButton>
              <Link href="/sign-up">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  Get Started
                </button>
              </Link>
            </SignedOut>
            
            <SignedIn>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-10 w-10"
                  }
                }}
              />
            </SignedIn>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link href="/" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              Home
            </Link>
            
            <SignedIn>
              <Link href="/dashboard" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Dashboard
              </Link>
              <Link href="/dashboard/analyze-single" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Analyze
              </Link>
              <Link href="/dashboard/credits" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Credits
              </Link>
              <Link href="/dashboard/settings" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Settings
              </Link>
            </SignedIn>

            <Link href="/pricing" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              Pricing
            </Link>
            
            <SignedOut>
              <div className="pt-4 border-t">
                <SignInButton mode="modal">
                  <button className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    Sign In
                  </button>
                </SignInButton>
                <Link href="/sign-up" className="block px-3 py-2 text-blue-600 font-medium hover:bg-gray-100 rounded-md">
                  Get Started
                </Link>
              </div>
            </SignedOut>
          </div>
        )}
      </nav>
    </header>
  );
}