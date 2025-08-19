'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
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
  ChevronDown
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Dashboard Stats
  const [stats, setStats] = useState({
    activeListings: 0,
    pendingListings: 0,
    soldThisMonth: 0,
    revenue: 0,
    avgSalePrice: 0,
    totalViews: 0,
    conversionRate: 0,
    topCategory: 'Fashion'
  });

  // Recent items
  const [recentItems, setRecentItems] = useState([]);

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
        const data = await creditsRes.json();
        setCredits(data.available || 0);
      }

      // Fetch stats
      const statsRes = await fetch('/api/user/stats');
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      // Fetch recent items
      const itemsRes = await fetch('/api/items/recent');
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setRecentItems(data.items || []);
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

  const handleBulkAction = (action) => {
    if (selectedItems.length === 0) {
      alert('Please select items first');
      return;
    }
    
    switch(action) {
      case 'list-ebay':
        router.push(`/dashboard/bulk-list/ebay?items=${selectedItems.join(',')}`);
        break;
      case 'list-vinted':
        router.push(`/dashboard/bulk-list/vinted?items=${selectedItems.join(',')}`);
        break;
      case 'delete':
        if (confirm(`Delete ${selectedItems.length} items?`)) {
          // Handle delete
        }
        break;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Navigation Bar */}
      <header className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border-b fixed top-0 left-0 right-0 z-50`}>
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Logo and Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LL</span>
              </div>
              <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-black'}`}>
                LightLister AI
              </span>
            </Link>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items, orders, or customers..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-white border-gray-300 text-black placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-black`}
              />
            </div>
          </div>

          {/* Right: Credits, Dark Mode, User */}
          <div className="flex items-center gap-4">
            {/* Credits Display */}
            <Link 
              href="/dashboard/credits"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                  : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
              } transition`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="font-medium">{credits} Credits</span>
              <Plus className="w-3 h-3" />
            </Link>

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
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user?.firstName?.[0] || 'U'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {/* Dropdown */}
              <div className={`absolute right-0 mt-2 w-48 py-2 rounded-lg shadow-lg border ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all`}>
                <Link href="/dashboard/settings" className={`flex items-center gap-2 px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
                <Link href="/dashboard/billing" className={`flex items-center gap-2 px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <CreditCard className="w-4 h-4" />
                  <span>Billing</span>
                </Link>
                <hr className={`my-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                <button className={`flex items-center gap-2 px-4 py-2 w-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Monthly Revenue
              </h3>
              <PoundSterling className="w-5 h-5 text-green-500" />
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
              £{stats.revenue.toFixed(2)}
            </p>
            <p className="text-sm text-green-500 mt-2">
              +12.5% from last month
            </p>
          </div>

          <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Active Listings
              </h3>
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
              {stats.activeListings}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {stats.pendingListings} pending
            </p>
          </div>

          <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Items Sold
              </h3>
              <CheckCircle className="w-5 h-5 text-purple-500" />
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
              {stats.soldThisMonth}
            </p>
            <p className="text-sm text-purple-500 mt-2">
              {stats.conversionRate}% conversion
            </p>
          </div>

          <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Views
              </h3>
              <Eye className="w-5 h-5 text-orange-500" />
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
              {stats.totalViews}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last 30 days
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/dashboard/analyze-single"
            className={`p-6 rounded-lg border-2 border-dashed ${
              darkMode 
                ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            } transition group`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} group-hover:scale-110 transition`}>
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
                  Single Item Analysis
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Upload up to 24 photos of one item
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/analyze-batch"
            className={`p-6 rounded-lg border-2 border-dashed ${
              darkMode 
                ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            } transition group`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} group-hover:scale-110 transition`}>
                <Images className="w-8 h-8" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
                  Batch Analysis
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Process up to 25 items at once
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Items Section */}
        <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Header */}
          <div className="p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
              Recent Items
            </h2>
            
            <div className="flex items-center gap-4">
              {/* Bulk Actions */}
              {selectedItems.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {selectedItems.length} selected
                  </span>
                  <button
                    onClick={() => handleBulkAction('list-ebay')}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    List on eBay
                  </button>
                  <button
                    onClick={() => handleBulkAction('list-vinted')}
                    className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                  >
                    List on Vinted
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              )}
              
              {/* View Toggle */}
              <div className="flex items-center gap-1 border rounded-lg p-1 ${darkMode ? 'border-gray-700' : 'border-gray-300'}">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? (darkMode ? 'bg-gray-700' : 'bg-gray-200') : ''}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? (darkMode ? 'bg-gray-700' : 'bg-gray-200') : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Items Grid/List */}
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Loading items...
              </p>
            </div>
          ) : recentItems.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No items yet. Start by analyzing your first item!
              </p>
              <Link
                href="/dashboard/analyze-single"
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                <Plus className="w-4 h-4" />
                Analyze Item
              </Link>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4' : 'divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}'}>
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className={viewMode === 'grid' 
                    ? `rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} overflow-hidden hover:shadow-lg transition`
                    : `p-4 flex items-center gap-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`
                  }
                >
                  {viewMode === 'grid' ? (
                    // Grid View
                    <>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, item.id]);
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== item.id));
                            }
                          }}
                          className="absolute top-2 left-2 z-10"
                        />
                        <img
                          src={item.images?.[0] || '/placeholder.jpg'}
                          alt={item.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute bottom-2 right-2 flex gap-1">
                          {item.ebay_listed && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                              eBay
                            </span>
                          )}
                          {item.vinted_listed && (
                            <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
                              Vinted
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className={`font-medium text-sm mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                          {item.title}
                        </h3>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                          {item.brand} • Size {item.size}
                        </p>
                        <p className="text-lg font-bold mb-2">
                          £{item.price}
                        </p>
                        <div className="flex gap-2">
                          <button className="flex-1 py-1 border rounded text-xs ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}">
                            Edit
                          </button>
                          <button className="flex-1 py-1 bg-black text-white rounded text-xs hover:bg-gray-800">
                            List
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    // List View
                    <>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, item.id]);
                          } else {
                            setSelectedItems(selectedItems.filter(id => id !== item.id));
                          }
                        }}
                      />
                      <img
                        src={item.images?.[0] || '/placeholder.jpg'}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                          {item.title}
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.brand} • Size {item.size} • {item.condition}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-bold">£{item.price}</p>
                        <div className="flex gap-2">
                          <button className="p-2 rounded hover:bg-gray-100">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded hover:bg-gray-100">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded hover:bg-gray-100 text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}