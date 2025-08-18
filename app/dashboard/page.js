// app/dashboard/page.js - COMPLETE DASHBOARD
'use client';

import { useUser } from '@clerk/nextjs';
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
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    creditsAvailable: 0,
    creditsTotal: 0,
    creditsUsed: 0,
    itemsAnalyzed: 0
  });
  const [recentAnalyses, setRecentAnalyses] = useState([]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    } else if (isSignedIn) {
      fetchUserData();
    }
  }, [isLoaded, isSignedIn, router]);

  const fetchUserData = async () => {
    try {
      // Fetch user stats
      const [statsResponse, analysesResponse] = await Promise.all([
        fetch('/api/user/stats'),
        fetch('/api/user/recent-analyses')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (analysesResponse.ok) {
        const analysesData = await analysesResponse.json();
        setRecentAnalyses(analysesData.analyses || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Not signed in (backup check)
  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.firstName || 'there'}!
              </h1>
              <p className="text-gray-600 mt-1">
                Here's your LightLister AI dashboard
              </p>
            </div>
            <Link 
              href="/dashboard/analyze-single"
              className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="h-4 w-4 mr-2" />
              New Analysis
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credits Available</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.creditsAvailable}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            {stats.creditsAvailable < 10 && (
              <p className="text-xs text-orange-600 mt-2">Running low - top up soon!</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Items Analyzed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.itemsAnalyzed}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credits Used</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.creditsUsed}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.itemsAnalyzed > 0 ? Math.round((stats.itemsAnalyzed / stats.creditsUsed) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/dashboard/analyze-single" 
                className="group flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Camera className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Analyze Single Item</p>
                    <p className="text-sm text-gray-600">Upload photos of one item</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
              </Link>

              <Link href="/dashboard/analyze-bulk" 
                className="group flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <Package2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Bulk Analysis</p>
                    <p className="text-sm text-gray-600">Analyze up to 25 items at once</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Analyses</h2>
              <Link href="/dashboard/listings" className="text-sm text-blue-600 hover:text-blue-700">
                View all →
              </Link>
            </div>
            
            {recentAnalyses.length > 0 ? (
              <div className="space-y-3">
                {recentAnalyses.slice(0, 5).map((analysis) => (
                  <Link
                    key={analysis.id}
                    href={`/dashboard/results?id=${analysis.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {analysis.brand} {analysis.item_type}
                        </p>
                        <p className="text-sm text-gray-600">
                          Size {analysis.size} • £{analysis.suggested_price}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No analyses yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Start by analyzing your first item!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/listings" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <Package className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">My Listings</h3>
            <p className="text-sm text-gray-600 mt-1">View and manage all your analyzed items</p>
          </Link>

          <Link href="/dashboard/get-credits" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <CreditCard className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Get Credits</h3>
            <p className="text-sm text-gray-600 mt-1">Top up your account with more credits</p>
          </Link>

          <Link href="/dashboard/tutorial" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <BookOpen className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Tutorial</h3>
            <p className="text-sm text-gray-600 mt-1">Learn how to get the best results</p>
          </Link>

          <Link href="/dashboard/settings" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <Settings className="h-8 w-8 text-gray-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Settings</h3>
            <p className="text-sm text-gray-600 mt-1">Manage your account preferences</p>
          </Link>

          <Link href="/dashboard/help" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <HelpCircle className="h-8 w-8 text-yellow-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Help & Support</h3>
            <p className="text-sm text-gray-600 mt-1">Get help with any issues</p>
          </Link>

          <div className="bg-blue-50 rounded-lg shadow p-6 border-2 border-blue-200">
            <AlertCircle className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Beta Program</h3>
            <p className="text-sm text-gray-600 mt-1">You're in the beta! Report bugs for bonus credits</p>
          </div>
        </div>
      </div>
    </div>
  );
}