// app/dashboard/page.js
// COMPLETE UK EBAY/VINTED DASHBOARD WITH REAL AI

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Camera,
  Images,
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

// UK eBay Categories and Item Specifics
const EBAY_UK_CLOTHING_SPECIFICS = {
  'Women\'s Clothing': {
    required: ['Brand', 'Size', 'Colour', 'Condition'],
    optional: ['Style', 'Material', 'Pattern', 'Occasion', 'Season', 'Fit', 'Size Type', 'Garment Care']
  },
  'Men\'s Clothing': {
    required: ['Brand', 'Size', 'Colour', 'Condition'],
    optional: ['Style', 'Material', 'Pattern', 'Fit', 'Season', 'Chest Size', 'Garment Care']
  },
  'Kids\' Clothing': {
    required: ['Brand', 'Size', 'Colour', 'Condition', 'Age'],
    optional: ['Style', 'Material', 'Pattern', 'Season', 'Gender', 'Garment Care']
  },
  'Shoes': {
    required: ['Brand', 'UK Shoe Size', 'Colour', 'Condition'],
    optional: ['Style', 'Material', 'Width', 'Heel Height', 'Occasion', 'Season']
  },
  'Bags & Accessories': {
    required: ['Brand', 'Colour', 'Condition'],
    optional: ['Style', 'Material', 'Size', 'Features', 'Closure', 'Pattern']
  }
};

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
      title: 'Bulk Analysis',
      description: 'Process up to 25 items with 24 photos each',
      icon: Images,
      color: 'purple',
      href: '/dashboard/analyze-bulk'
    }
  ];

  const navigationItems = [
    { label: 'Dashboard', href: '/dashboard', current: true },
    { label: 'Single Analysis', href: '/dashboard/analyze-single' },
    { label: 'Bulk Analysis', href: '/dashboard/analyze-bulk' },
    { label: 'My Listings', href: '/dashboard/listings' },
    { label: 'Analytics', href: '/dashboard/analytics' },
    { label: 'Settings', href: '/dashboard/settings' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">LightLister AI</h1>
              <span className="ml-2 text-xs text-gray-500">UK Edition</span>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Credits Display */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">
                    {credits.available} credits
                  </span>
                </div>
                <Link
                  href="/dashboard/get-credits"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Get More
                </Link>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">
                  {user?.emailAddresses?.[0]?.emailAddress}
                </span>
                <Link
                  href="/dashboard/settings"
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
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
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'there'}!
          </h2>
          <p className="text-gray-600 mt-1">
            Create professional eBay UK and Vinted listings with AI
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Monthly Revenue</span>
              <PoundSterling className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              £{stats.revenue.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              This month on eBay UK
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Active Listings</span>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.activeListings}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Across all platforms
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Items Sold</span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.soldThisMonth}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              This month
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Views</span>
              <Eye className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.views}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Last 30 days
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Create New Listing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className={`block p-6 bg-white rounded-lg shadow-sm border-2 hover:shadow-md transition ${
                    action.primary 
                      ? 'border-blue-200 hover:border-blue-300' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`p-3 rounded-lg ${
                      action.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        action.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                      }`} />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {action.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {action.description}
                      </p>
                      {action.primary && (
                        <span className="inline-flex items-center mt-3 text-sm font-medium text-blue-600">
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
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Analyses
                </h3>
                <Link
                  href="/dashboard/listings"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View all
                </Link>
              </div>
            </div>
            
            <div className="divide-y">
              {recentAnalyses.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {analysis.ebay_title}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>{analysis.brand}</span>
                        <span>Size: {analysis.size}</span>
                        <span>£{analysis.suggested_price}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/listings/${analysis.id}/ebay`}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        List on eBay
                      </Link>
                      <Link
                        href={`/dashboard/listings/${analysis.id}/vinted`}
                        className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
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

        {/* Platform Integration Status */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">eBay UK</h3>
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Connection Status</span>
                <span className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Active Listings</span>
                <span className="font-medium">{stats.activeListings}</span>
              </div>
              <Link
                href="/dashboard/ebay-settings"
                className="block w-full mt-4 px-4 py-2 text-sm text-center border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Manage eBay Settings
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Vinted</h3>
              <Heart className="w-5 h-5 text-purple-600" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Export Ready</span>
                <span className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Available
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">CSV Format</span>
                <span className="font-medium">UK Standard</span>
              </div>
              <Link
                href="/dashboard/vinted-export"
                className="block w-full mt-4 px-4 py-2 text-sm text-center border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Export to Vinted
              </Link>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900">
                Getting Started Tips
              </h3>
              <p className="text-sm text-blue-800 mt-1">
                Upload clear photos with good lighting for best AI results. Include size labels, brand tags, and any flaws. 
                Our AI will detect brands, sizes, and generate SEO-optimized titles for eBay UK and Vinted.
              </p>
              <div className="flex gap-4 mt-3">
                <Link
                  href="/dashboard/help"
                  className="text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  View Help Guide →
                </Link>
                <Link
                  href="/dashboard/tutorial"
                  className="text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  Watch Tutorial →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}