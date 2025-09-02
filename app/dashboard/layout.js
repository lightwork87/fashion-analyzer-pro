'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Camera, 
  Package, 
  CreditCard, 
  Settings, 
  History,
  Upload,
  DollarSign
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user } = useUser();
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Analyze Single', href: '/dashboard/analyze-single', icon: Camera },
    { name: 'Batch Upload', href: '/dashboard/smart-upload', icon: Upload },
    { name: 'My Listings', href: '/dashboard/listings', icon: Package },
    { name: 'History', href: '/dashboard/history', icon: History },
    { name: 'Credits', href: '/dashboard/credits', icon: CreditCard },
    { name: 'Pricing', href: '/dashboard/pricing', icon: DollarSign },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <p className="text-sm text-gray-500">Welcome back,</p>
          <p className="font-semibold text-gray-900">
            {user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'User'}
          </p>
        </div>
        
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}