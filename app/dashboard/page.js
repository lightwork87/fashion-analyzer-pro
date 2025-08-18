// app/dashboard/page.js - COMPLETE DASHBOARD WITH SIDEBAR
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
  ChevronRight,
  Home,
  Upload,
  List,
  ShoppingBag,
  Menu,
  X,
  FileText,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    creditsTotal: 0,
    creditsUsed: 0,
    creditsAvailable: 0,
    itemsAnalyzed: 0,
    itemsListed: 0,
    totalValue: 0
  });
  const [recentAnalyses, setRecentAnalyses] = useState([]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchUserStats();
      fetchRecentAnalyses();
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

  const fetchRecentAnalyses = async () => {
    try {
      const response = await fetch('/api/user/recent-analyses');
      if (response.ok) {
        const data = await response.json();
        setRecentAnalyses(data.analyses || []);
      }
    } catch (error) {
      console.error('Error fetching recent analyses:', error);
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
            <Sparkles className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Welcome to LightLister AI</h2>
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

  // Navigation items
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: true },
    { name: 'Analyze Single', href: '/dashboard/analyze-single', icon: Camera },
    { name: 'Bulk Analysis', href: '/dashboard/analyze-bulk', icon: Package2 },
    { name: 'My Listings', href: '/dashboard/listings', icon: List },
    { name: 'Get Credits', href: '/dashboard/get-credits', icon: CreditCard },
    { name: 'Tutorial', href: '/dashboard/tutorial', icon: BookOpen },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Link href="/" className="flex items-center">
                <Sparkles className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">LightLister AI</span>
              </Link>
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    item.current
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      item.current ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* User info at bottom */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">{user?.firstName || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.emailAddresses[0]?.emailAddress}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`md:hidden ${sidebarOpen ? 'fixed inset-0 z-40' : ''}`}>
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 ${sidebarOpen ? '' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />
        
        <div className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <Link href="/" className="flex items-center">
              <Sparkles className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">LightLister AI</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    item.current ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col w-0 flex-1">
        {/* Top bar - Mobile */}
        <div className="md:hidden flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6 text-gray-500" />
          </button>
          <Link href="/" className="flex items-center">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">LightLister AI</span>
          </Link>
          <div className="w-6" /> {/* Spacer for centering */}
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">Welcome back, {user?.firstName || 'User'}!</p>
            </div>
            
            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Credits Available */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CreditCard className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Credits Available
                          </dt>
                          <dd className="mt-1 text-3xl font-semibold text-gray-900">
                            {stats.creditsAvailable || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <Link href="/dashboard/get-credits" className="text-sm text-blue-600 hover:text-blue-900">
                      Buy more credits →
                    </Link>
                  </div>
                </div>

                {/* Items Analyzed */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <BarChart3 className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Items Analyzed
                          </dt>
                          <dd className="mt-1 text-3xl font-semibold text-gray-900">
                            {stats.itemsAnalyzed || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <Link href="/dashboard/listings" className="text-sm text-green-600 hover:text-green-900">
                      View all listings →
                    </Link>
                  </div>
                </div>

                {/* Items Listed */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Package className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Items Listed
                          </dt>
                          <dd className="mt-1 text-3xl font-semibold text-gray-900">
                            {stats.itemsListed || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <span className="text-sm text-gray-500">
                      Active on platforms
                    </span>
                  </div>
                </div>

                {/* Total Value */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <TrendingUp className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Value
                          </dt>
                          <dd className="mt-1 text-3xl font-semibold text-gray-900">
                            £{(stats.totalValue || 0).toFixed(2)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <span className="text-sm text-gray-500">
                      Estimated listings value
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/dashboard/analyze-single" 
                    className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <div className="flex-shrink-0">
                      <Camera className="h-10 w-10 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-lg font-medium text-gray-900">Analyze Single Item</p>
                      <p className="text-sm text-gray-500">Upload photos of one item</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>

                  <Link href="/dashboard/analyze-bulk" 
                    className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <div className="flex-shrink-0">
                      <Package2 className="h-10 w-10 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-lg font-medium text-gray-900">Bulk Analysis</p>
                      <p className="text-sm text-gray-500">Analyze up to 25 items at once</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>
                </div>
              </div>

              {/* Recent Analyses */}
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Analyses</h2>
                {recentAnalyses.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No analyses yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by analyzing your first item.</p>
                    <div className="mt-6">
                      <Link
                        href="/dashboard/analyze-single"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Upload className="-ml-1 mr-2 h-5 w-5" />
                        Analyze First Item
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {recentAnalyses.map((analysis) => (
                        <li key={analysis.id}>
                          <Link href={`/dashboard/results?id=${analysis.id}`} className="block hover:bg-gray-50 px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <Package className="h-10 w-10 text-gray-400" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {analysis.ebay_title || analysis.item_type || 'Fashion Item'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {analysis.brand} • Size {analysis.size}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="text-right mr-4">
                                  <p className="text-sm font-medium text-gray-900">
                                    £{analysis.suggested_price}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    <Clock className="inline h-3 w-3 mr-1" />
                                    {new Date(analysis.created_at).toLocaleDateString('en-GB')}
                                  </p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Help Section */}
              <div className="mt-8 bg-blue-50 rounded-lg p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <HelpCircle className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Need help getting started?</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Check out our tutorial to learn how to use LightLister AI effectively.</p>
                    </div>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <Link
                          href="/dashboard/tutorial"
                          className="bg-blue-50 px-2 py-1.5 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          View tutorial
                        </Link>
                        <Link
                          href="/dashboard/help"
                          className="ml-3 bg-blue-50 px-2 py-1.5 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          Get support
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}