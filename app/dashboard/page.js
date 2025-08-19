'use client';

import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  Moon,
  Sun,
  Home,
  Menu,
  X,
  RefreshCw,
  Send,
  Database,
  DollarSign,
  Users,
  Box,
  Grid,
  List,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  ChevronDown,
  Loader2
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [credits, setCredits] = useState({ available: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    soldThisMonth: 0,
    revenue: 0,
    avgSalePrice: 0,
    views: 0
  });
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
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

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut(() => {
        router.push('/');
      });
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
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

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border-b fixed top-0 left-0 right-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg mr-4 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                  <span className="text-white dark:text-black font-bold text-sm">LL</span>
                </div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                  LightLister AI
                </h1>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>UK Edition</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Credits Display */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CreditCard className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                    {credits.available} credits
                  </span>
                </div>
                <Link
                  href="/dashboard/credits"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Get More
                </Link>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* User Menu */}
              <div className="relative group">
                <button className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                  <div className={`w-8 h-8 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded-full flex items-center justify-center`}>
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      {user?.firstName?.[0] || 'U'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {/* Dropdown Menu */}
                <div className={`absolute right-0 mt-2 w-56 py-2 rounded-lg shadow-lg border ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                } opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all`}>
                  
                  {/* User Info */}
                  <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                      {user?.emailAddresses?.[0]?.emailAddress}
                    </p>
                  </div>
                  
                  {/* Menu Items */}
                  <Link 
                    href="/dashboard/settings" 
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  
                  <Link 
                    href="/dashboard/billing" 
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Billing & Credits</span>
                  </Link>
                  
                  <Link 
                    href="/dashboard/help" 
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Help & Support</span>
                  </Link>
                  
                  <hr className={`my-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                  
                  {/* Sign Out Button */}
                  <button 
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className={`flex items-center gap-2 px-4 py-2 w-full text-left text-sm ${
                      darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                    } ${isSigningOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSigningOut ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing out...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`fixed left-0 top-16 bottom-0 w-64 ${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border-r transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform z-40`}>
        <nav className="p-4 space-y-1">
          {/* Main Navigation */}
          <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'}`}>
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          
          <div className="pt-4 pb-2">
            <h3 className={`px-3 text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Listing Tools
            </h3>
          </div>
          
          <Link href="/dashboard/analyze-single" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <Camera className="w-5 h-5" />
            <span>Single Item Analysis</span>
          </Link>
          
          <Link href="/dashboard/analyze-batch" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <Images className="w-5 h-5" />
            <span>Batch Analysis (25)</span>
          </Link>
          
          <Link href="/dashboard/inventory" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <Package className="w-5 h-5" />
            <span>Inventory</span>
          </Link>
          
          <Link href="/dashboard/drafts" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <FileText className="w-5 h-5" />
            <span>Drafts</span>
          </Link>

          <div className="pt-4 pb-2">
            <h3 className={`px-3 text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Marketplaces
            </h3>
          </div>
          
          <Link href="/dashboard/ebay" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <ShoppingBag className="w-5 h-5" />
            <span>eBay UK</span>
          </Link>
          
          <Link href="/dashboard/vinted" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <Tag className="w-5 h-5" />
            <span>Vinted</span>
          </Link>

          <div className="pt-4 pb-2">
            <h3 className={`px-3 text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Analytics
            </h3>
          </div>
          
          <Link href="/dashboard/analytics" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <BarChart3 className="w-5 h-5" />
            <span>Sales Analytics</span>
          </Link>
          
          <Link href="/dashboard/pricing-guide" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <TrendingUp className="w-5 h-5" />
            <span>UK Pricing Guide</span>
          </Link>

          <div className="pt-4 pb-2">
            <h3 className={`px-3 text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Other
            </h3>
          </div>
          
          <Link href="/dashboard/beta" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <AlertCircle className="w-5 h-5" />
            <span>Beta Features</span>
          </Link>
          
          <Link href="/dashboard/help" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <HelpCircle className="w-5 h-5" />
            <span>Help & Support</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'ml-64' : 'ml-0'} mt-16 p-6 transition-all`}>
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Welcome back, {user?.firstName || 'there'}!
          </h2>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Create professional eBay UK and Vinted listings with AI
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monthly Revenue</span>
              <PoundSterling className="w-5 h-5 text-green-600" />
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              £{stats.revenue.toFixed(2)}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              This month on eBay UK
            </p>
          </div>

          <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Listings</span>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {stats.activeListings}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Across all platforms
            </p>
          </div>

          <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Items Sold</span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {stats.soldThisMonth}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              This month
            </p>
          </div>

          <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Views</span>
              <Eye className="w-5 h-5 text-orange-600" />
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {stats.views}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Last 30 days
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Create New Listing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className={`block p-6 rounded-lg border-2 hover:shadow-md transition ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } ${
                    action.primary 
                      ? 'border-blue-200 hover:border-blue-300 dark:border-blue-800 dark:hover:border-blue-700' 
                      : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`p-3 rounded-lg ${
                      action.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        action.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                      }`} />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {action.title}
                      </h4>
                      <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
          <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
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
            
            <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {recentAnalyses.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className={`p-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {analysis.ebay_title}
                      </h4>
                      <div className={`flex items-center gap-4 mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span>{analysis.brand}</span>
                        <span>Size: {analysis.size}</span>
                        <span>£{analysis.suggested_price}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/listing/${analysis.id}/ebay`}
                        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                      >
                        List on eBay
                      </Link>
                      <Link
                        href={`/dashboard/listing/${analysis.id}/vinted`}
                        className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800"
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