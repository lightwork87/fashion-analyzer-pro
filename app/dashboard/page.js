// app/dashboard/page.js
// COMPLETE DASHBOARD WITH PROPER DARK MODE SUPPORT

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Camera,
  Image,
  CreditCard,
  Package,
  TrendingUp,
  PoundSterling,
  ShoppingBag,
  Tag,
  Eye,
  Heart,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Upload,
  FileText,
  History,
  HelpCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [credits, setCredits] = useState({ available: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    soldThisMonth: 0,
    revenue: 0,
    avgSalePrice: 0,
    views: 0
  });
  const [recentAnalyses, setRecentAnalyses] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch credits
      const creditsRes = await fetch('/api/user/credits');
      if (creditsRes.ok) {
        const creditsData = await creditsRes.json();
        setCredits({
          available: creditsData.available || 0,
          total: creditsData.total || 0
        });
      }

      // Fetch stats
      const statsRes = await fetch('/api/user/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch recent analyses
      const analysesRes = await fetch('/api/analyses/recent');
      if (analysesRes.ok) {
        const analysesData = await analysesRes.json();
        setRecentAnalyses(analysesData.analyses || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Single Item Analysis',
      description: 'Upload photos of one item for AI-powered listing creation',
      icon: Camera,
      color: 'blue',
      href: '/dashboard/analyze-single',
      primary: true
    },
    {
      title: 'Batch Processing',
      description: 'Process up to 25 items with 24 photos each',
      icon: Image,
      color: 'purple',
      href: '/dashboard/batch-processing/'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with dark mode support */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">LightLister AI</h1>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">UK Edition</span>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Credits Display with dark mode */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {credits.available} credits
                  </span>
                </div>
                <Link
                  href="/dashboard/get-credits"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Get More
                </Link>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.emailAddresses?.[0]?.emailAddress}
                </span>
                <Link
                  href="/dashboard/settings"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName || 'there'}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create professional eBay UK and Vinted listings with AI
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Revenue</span>
              <PoundSterling className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              £{stats.revenue.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              This month on eBay UK
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Listings</span>
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.activeListings}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Across all platforms
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Items Sold</span>
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.soldThisMonth}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              This month
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Views</span>
              <Eye className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.views}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Last 30 days
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create New Listing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className={`block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 hover:shadow-md transition ${
                    action.primary 
                      ? 'border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`p-3 rounded-lg ${
                      action.color === 'blue' 
                        ? 'bg-blue-100 dark:bg-blue-900/30' 
                        : 'bg-purple-100 dark:bg-purple-900/30'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        action.color === 'blue' 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-purple-600 dark:text-purple-400'
                      }`} />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {action.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {action.description}
                      </p>
                      {action.primary && (
                        <span className="inline-flex items-center mt-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                          Start analyzing →
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Analyses */}
        {recentAnalyses.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Analyses
                </h3>
                <Link
                  href="/dashboard/listings"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View all
                </Link>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentAnalyses.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {analysis.ebay_title}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span>{analysis.brand}</span>
                        <span>Size: {analysis.size}</span>
                        <span>£{analysis.suggested_price}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/listing/${analysis.id}/ebay`}
                        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                      >
                        List on eBay
                      </Link>
                      <Link
                        href={`/dashboard/listing/${analysis.id}/vinted`}
                        className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
                      >
                        List on Vinted
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}