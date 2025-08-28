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
  HelpCircle,
  Clock,
  Star,
  ExternalLink,
  Zap,
  Target,
  DollarSign,
  Users,
  Crown,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [credits, setCredits] = useState({ available: 0, total: 0, used: 0 });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    soldThisMonth: 0,
    revenue: 0,
    avgSalePrice: 0,
    views: 0,
    watchers: 0,
    conversionRate: 0
  });
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [subscription, setSubscription] = useState({
    plan: 'free',
    status: 'active',
    renewsAt: null
  });

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
          available: creditsData.available || 10,
          total: creditsData.total || 50,
          used: creditsData.used || 0
        });
      }

      // Fetch stats (mock data for now)
      setStats({
        totalListings: 147,
        activeListings: 23,
        soldThisMonth: 18,
        revenue: 342.50,
        avgSalePrice: 19.03,
        views: 1247,
        watchers: 34,
        conversionRate: 12.2
      });

      // Fetch recent analyses (mock data)
      setRecentAnalyses([
        {
          id: 1,
          ebay_title: 'Zara Women\'s Blue Midi Dress Size 12 Excellent Condition',
          brand: 'Zara',
          size: '12',
          suggested_price: 24.99,
          condition_score: 9,
          analyzed_at: '2025-08-28T10:30:00Z',
          status: 'draft'
        },
        {
          id: 2,
          ebay_title: 'Nike Men\'s Air Max Trainers Size 10 Good Condition',
          brand: 'Nike',
          size: '10',
          suggested_price: 35.00,
          condition_score: 7,
          analyzed_at: '2025-08-28T09:15:00Z',
          status: 'listed'
        }
      ]);
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
      primary: true,
      badge: 'Most Popular'
    },
    {
      title: 'Bulk Analysis (Coming Soon)',
      description: 'Process up to 25 items with 24 photos each',
      icon: Images,
      color: 'purple',
      href: '/dashboard/analyze-bulk',
      disabled: true,
      badge: 'Pro Feature'
    }
  ];

  const platformOptions = [
    {
      name: 'eBay UK',
      icon: '🛒',
      description: 'Direct listing to eBay with our API integration',
      status: 'Connected',
      color: 'green'
    },
    {
      name: 'Vinted',
      icon: '👗',
      description: 'Export CSV files ready for Vinted bulk upload',
      status: 'Available',
      color: 'blue'
    },
    {
      name: 'Depop',
      icon: '📱',
      description: 'Coming soon - direct integration',
      status: 'Coming Soon',
      color: 'gray'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">LightLister AI</h1>
                  <span className="text-xs text-gray-500">UK Reseller Edition</span>
                </div>
              </div>
              
              {subscription.plan === 'free' && (
                <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full">
                  <Crown className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-purple-700 font-medium">Upgrade to Pro</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Credits Display */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-lg">
                  <CreditCard className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">
                    {credits.available} credits
                  </span>
                </div>
                <Link
                  href="/dashboard/get-credits"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Get More
                </Link>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {subscription.plan} Plan
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm text-white font-medium">
                    {(user?.firstName?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName || 'there'}! 👋
              </h2>
              <p className="text-gray-600 mt-1 text-lg">
                Create professional eBay UK and Vinted listings with AI
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">All systems operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview - Vendoo/eBay Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <PoundSterling className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  £{stats.revenue.toFixed(2)}
                </p>
                <p className="text-xs text-green-600 font-medium">+12.5%</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1">
              <div className="bg-green-500 h-1 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Listings</p>
                  <p className="text-xs text-gray-500">Live now</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeListings}
                </p>
                <p className="text-xs text-blue-600 font-medium">of {stats.totalListings}</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1">
              <div className="bg-blue-500 h-1 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Items Sold</p>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.soldThisMonth}
                </p>
                <p className="text-xs text-purple-600 font-medium">£{stats.avgSalePrice} avg</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1">
              <div className="bg-purple-500 h-1 rounded-full" style={{ width: '72%' }}></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-xs text-gray-500">Last 30 days</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.views}
                </p>
                <p className="text-xs text-orange-600 font-medium">{stats.conversionRate}% rate</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1">
              <div className="bg-orange-500 h-1 rounded-full" style={{ width: '58%' }}></div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Enhanced */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Create New Listing
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Zap className="w-4 h-4" />
              <span>Powered by AI</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.title}
                  className={`relative group ${action.disabled ? 'opacity-60' : ''}`}
                >
                  <Link
                    href={action.disabled ? '#' : action.href}
                    className={`block p-6 bg-white rounded-xl shadow-sm border-2 transition-all ${
                      action.disabled 
                        ? 'border-gray-200 cursor-not-allowed' 
                        : action.primary 
                        ? 'border-blue-200 hover:border-blue-300 hover:shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-3 rounded-xl ${
                          action.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            action.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {action.title}
                            </h4>
                            {action.badge && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                action.badge === 'Most Popular' 
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {action.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {action.description}
                          </p>
                          {action.primary && !action.disabled && (
                            <div className="flex items-center space-x-2 text-sm font-medium text-blue-600">
                              <span>Start analyzing</span>
                              <ExternalLink className="w-4 h-4" />
                            </div>
                          )}
                          {action.disabled && (
                            <div className="flex items-center space-x-2 text-sm font-medium text-gray-500">
                              <Crown className="w-4 h-4" />
                              <span>Upgrade required</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform Integration */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Platform Integration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {platformOptions.map((platform) => (
              <div key={platform.name} className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{platform.icon}</span>
                    <span className="font-medium text-gray-900">{platform.name}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    platform.color === 'green' ? 'bg-green-100 text-green-700' :
                    platform.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {platform.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{platform.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Analyses */}
        {recentAnalyses.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Analyses
                </h3>
                <Link
                  href="/dashboard/listings"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <span>View all</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {recentAnalyses.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                          {analysis.ebay_title}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          analysis.status === 'listed' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {analysis.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="font-medium">{analysis.brand}</span>
                        <span>Size: {analysis.size}</span>
                        <span className="font-medium text-green-600">£{analysis.suggested_price}</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span>{analysis.condition_score}/10</span>
                        </div>
                        <span className="text-gray-500">
                          {new Date(analysis.analyzed_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/dashboard/listing/${analysis.id}/ebay`}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center space-x-1"
                      >
                        <span>List on eBay</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <Link
                        href={`/dashboard/listing/${analysis.id}/vinted`}
                        className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition flex items-center space-x-1"
                      >
                        <span>Export Vinted</span>
                        <Upload className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade CTA for Free Users */}
        {subscription.plan === 'free' && (
          <div className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Unlock Pro Features</h3>
                <p className="text-purple-100 mb-4">
                  Get unlimited analyses, bulk processing, and priority support
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>25 item batch processing</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Priority AI processing</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Advanced analytics</span>
                  </div>
                </div>
              </div>
              <Link
                href="/dashboard/upgrade"
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition flex items-center space-x-2"
              >
                <Crown className="w-5 h-5" />
                <span>Upgrade Now</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}