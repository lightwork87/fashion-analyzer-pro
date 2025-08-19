'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import SignOutButton from '../components/SignOutButton';
import CreditsDisplay from '../components/CreditsDisplay';
import ThemeToggle from '../components/ThemeToggle';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const { user } = useUser();

  const menuItems = [
    { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { href: '/dashboard/analyze-single', icon: '📸', label: 'Single Analysis' },
    { href: '/dashboard/analyze-batch', icon: '📦', label: 'Batch Processing' },
    { href: '/dashboard/history', icon: '📊', label: 'History' },
    { href: '/dashboard/pricing', icon: '💳', label: 'Buy Credits' },
    { href: '/dashboard/beta', icon: '🚀', label: 'Beta Program' },
    { href: '/dashboard/support', icon: '💬', label: 'Support' },
    { href: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 fixed w-full top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                  <span className="text-white dark:text-black font-bold text-sm">LL</span>
                </div>
                <h1 className="text-xl font-bold dark:text-white">LightLister AI</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CreditsDisplay />
              <ThemeToggle />
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                {user?.emailAddresses?.[0]?.emailAddress}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-16 h-full bg-white dark:bg-gray-800 border-r dark:border-gray-700 transition-all duration-300 z-30 ${
        sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
      }`}>
        <div className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {children}
      </main>
    </div>
  );
}