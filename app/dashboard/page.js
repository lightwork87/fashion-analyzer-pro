// app/dashboard/page.js - COMPLETE FILE
'use client';

import { useUser, SignIn, SignInButton } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  Camera, 
  CreditCard, 
  Settings, 
  HelpCircle,
  BookOpen,
  BarChart3,
  Zap,
  Package2,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState({
    creditsTotal: 0,
    creditsUsed: 0,
    itemsAnalyzed: 0
  });

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchUserStats();
    }
  }, [isLoaded, isSignedIn]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in if not authenticated
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Welcome to LightLister AI</h2>
            <p className="mt-2 text-gray-600">Please sign in to access your dashboard</p>
          </div>
          
          <div className="mt-8">
            <SignInButton mode="modal">
              <button className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Sign In to Continue
              </button>
            </SignInButton>
          </div>
          
          <div className="text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link href="/sign-up" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard for signed-in users
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName || 'User'}
              </span>
              <Link href="/dashboard/settings" className="text-gray-500 hover:text-gray-700">
                <Settings className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credits Available</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.creditsTotal - stats.creditsUsed}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Items Analyzed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.itemsAnalyzed}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credits Used</p>
                <p className="text-2xl font-bold text-gray-900">{stats.creditsUsed}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/dashboard/analyze-single" 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Camera className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Analyze Single Item</p>
                    <p className="text-sm text-gray-600">Upload photos of one item</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>

              <Link href="/dashboard/analyze-bulk" 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Package2 className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Bulk Analysis</p>
                    <p className="text-sm text-gray-600">Analyze up to 25 items</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/listings" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <Package className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">My Listings</h3>
            <p className="text-sm text-gray-600 mt-1">View and manage your listings</p>
          </Link>

          <Link href="/dashboard/get-credits" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <CreditCard className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Get Credits</h3>
            <p className="text-sm text-gray-600 mt-1">Purchase analysis credits</p>
          </Link>

          <Link href="/dashboard/tutorial" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <BookOpen className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Tutorial</h3>
            <p className="text-sm text-gray-600 mt-1">Learn how to use LightLister</p>
          </Link>

          <Link href="/dashboard/settings" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <Settings className="h-8 w-8 text-gray-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Settings</h3>
            <p className="text-sm text-gray-600 mt-1">Manage your account</p>
          </Link>

          <Link href="/dashboard/help" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <HelpCircle className="h-8 w-8 text-yellow-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Help & Support</h3>
            <p className="text-sm text-gray-600 mt-1">Get assistance</p>
          </Link>

          <Link href="/" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <BarChart3 className="h-8 w-8 text-indigo-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Back to Home</h3>
            <p className="text-sm text-gray-600 mt-1">Return to main site</p>
          </Link>
        </div>
      </div>
    </div>
  );
}