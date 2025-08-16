// app/components/Navigation.js
// Updated with integrated credit display

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import CreditDisplay from './CreditDisplay';
import { 
  Home, 
  Package, 
  Plus, 
  BarChart3, 
  Settings,
  CreditCard
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/inventory', label: 'Inventory', icon: Package },
    { href: '/dashboard/smart-upload', label: 'New Listing', icon: Plus },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                LightLister AI
              </Link>
            </div>

            {/* Right side items */}
            <div className="flex items-center gap-6">
              {/* Credit Display */}
              <CreditDisplay />
              
              {/* Get Credits Button */}
              <Link
                href="/dashboard/get-credits"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                <CreditCard className="w-4 h-4" />
                Get Credits
              </Link>
              
              {/* User Button */}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </div>

      {/* Side Navigation */}
      <div className="flex h-screen pt-16">
        <nav className="w-64 bg-gray-50 border-r border-gray-200">
          <div className="p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {/* Content will be rendered here */}
        </main>
      </div>
    </>
  );
}