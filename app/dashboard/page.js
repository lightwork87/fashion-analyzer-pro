// app/dashboard/page.js
// COMPLETE VENDOO-STYLE DASHBOARD FOR EBAY SELLERS

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  BarChart3, 
  Plus, 
  FileText, 
  Settings, 
  CreditCard,
  AlertCircle,
  TrendingUp,
  Clock,
  DollarSign,
  ShoppingBag,
  Camera,
  Upload,
  Zap,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Calendar,
  Tag,
  Grid,
  List,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [credits, setCredits] = useState({ total: 60, used: 0, available: 60 });
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [stats, setStats] = useState({
    totalListings: 156,
    activeListings: 89,
    soldThisMonth: 34,
    revenue: 2847.50,
    avgSalePrice: 83.75,
    conversionRate: 21.8
  });
  const [recentListings, setRecentListings] = useState([
    {
      id: 1,
      title: 'Nike Air Max 90 Size 10 - Excellent Condition',
      sku: 'NK-001',
      status: 'active',
      price: 89.99,
      views: 234,
      watchers: 12,
      image: '/api/placeholder/120/120',
      created: '2024-01-14',
      platform: 'ebay'
    },
    {
      id: 2,
      title: 'Zara Floral Dress Size M - New with Tags',
      sku: 'ZR-045',
      status: 'active',
      price: 34.99,
      views: 156,
      watchers: 8,
      image: '/api/placeholder/120/120',
      created: '2024-01-13',
      platform: 'ebay'
    },
    {
      id: 3,
      title: 'Vintage Levi\'s 501 Jeans W32 L32',
      sku: 'LV-089',
      status: 'sold',
      price: 65.00,
      soldPrice: 62.50,
      views: 412,
      image: '/api/placeholder/120/120',
      created: '2024-01-10',
      soldDate: '2024-01-14',
      platform: 'ebay'
    },
    {
      id: 4,
      title: 'Adidas Originals Hoodie Size L - Good Condition',
      sku: 'AD-234',
      status: 'draft',
      price: 45.00,
      views: 0,
      watchers: 0,
      image: '/api/placeholder/120/120',
      created: '2024-01-14',
      platform: 'ebay'
    }
  ]);

  useEffect(() => {
    fetchCredits();
    fetchStats();
  }, []);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits({
          total: data.total || 60,
          used: data.used || 0,
          available: data.available || 60
        });
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  };

  const fetchStats = async () => {
    // In real app, fetch from API
    // For now using mock data
  };

  const filteredListings = recentListings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || listing.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">LightLister AI</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Credits Display */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <CreditCard className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">{credits.available} credits</span>
              </div>
              
              <Link
                href="/dashboard/get-credits"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Get More
              </Link>
              
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen pt-4">
          <div className="px-4 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg"
            >
              <Grid className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            
            <Link
              href="/dashboard/inventory"
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              <Package className="w-5 h-5" />
              <span>Inventory</span>
            </Link>
            
            <Link
              href="/dashboard/smart-upload"
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              <Camera className="w-5 h-5" />
              <span>Create Listing</span>
            </Link>
            
            <Link
              href="/dashboard/batch"
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              <Upload className="w-5 h-5" />
              <span>Batch Upload</span>
            </Link>
            
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </Link>
            
            <Link
              href="/dashboard/ebay-integration"
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>eBay Tools</span>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 px-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/dashboard/smart-upload')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                New Listing
              </button>
              
              <button
                onClick={() => router.push('/dashboard/batch')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <Upload className="w-4 h-4" />
                Batch Upload
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Welcome Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.firstName || 'User'}!
            </h2>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your store today
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">${stats.revenue.toFixed(2)}</p>
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <ArrowUp className="w-4 h-4 mr-1" />
                +12.5% from last month
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Active Listings</p>
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeListings}</p>
              <p className="text-sm text-gray-600 mt-2">
                of {stats.totalListings} total
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Items Sold</p>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.soldThisMonth}</p>
              <p className="text-sm text-purple-600 mt-2 flex items-center">
                <ArrowUp className="w-4 h-4 mr-1" />
                {stats.conversionRate}% conversion
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Avg Sale Price</p>
                <Tag className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">${stats.avgSalePrice}</p>
              <p className="text-sm text-gray-600 mt-2">
                Per item sold
              </p>
            </div>
          </div>

          {/* Recent Listings Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Listings</h3>
                
                <div className="flex items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search listings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="sold">Sold</option>
                    <option value="draft">Draft</option>
                  </select>

                  {/* View Toggle */}
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    href="/dashboard/inventory"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All
                  </Link>
                </div>
              </div>
            </div>

            {/* Listings Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {filteredListings.map((listing) => (
                  <div key={listing.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
                    <div className="aspect-square bg-gray-100 relative">
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded ${
                        listing.status === 'active' ? 'bg-green-100 text-green-800' :
                        listing.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {listing.status}
                      </span>
                    </div>
                    
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                        {listing.title}
                      </h4>
                      <p className="text-sm text-gray-500 mb-2">SKU: {listing.sku}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-semibold text-gray-900">
                          ${listing.status === 'sold' ? listing.soldPrice : listing.price}
                        </span>
                        {listing.status === 'sold' && listing.price !== listing.soldPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ${listing.price}
                          </span>
                        )}
                      </div>
                      
                      {listing.status === 'active' && (
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {listing.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {listing.watchers}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-4">
                        <button className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                          Edit
                        </button>
                        <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredListings.map((listing) => (
                      <tr key={listing.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <img
                              src={listing.image}
                              alt={listing.title}
                              className="w-10 h-10 rounded object-cover mr-3"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{listing.title}</p>
                              <p className="text-sm text-gray-500">SKU: {listing.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                            listing.status === 'active' ? 'bg-green-100 text-green-800' :
                            listing.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {listing.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            ${listing.status === 'sold' ? listing.soldPrice : listing.price}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {listing.status === 'active' ? (
                            <div className="text-sm text-gray-600">
                              <p>{listing.views} views</p>
                              <p>{listing.watchers} watchers</p>
                            </div>
                          ) : listing.status === 'sold' ? (
                            <p className="text-sm text-gray-600">
                              Sold on {listing.soldDate}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">—</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="text-sm text-blue-600 hover:text-blue-700">
                              Edit
                            </button>
                            <button className="text-sm text-gray-600 hover:text-gray-700">
                              Duplicate
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <Zap className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Pro Tip: Optimize Your Listings
                </h3>
                <p className="text-sm text-blue-800">
                  Items with 12+ high-quality photos sell 23% faster. Use our AI analysis to create perfect titles and descriptions that boost visibility.
                </p>
                <button 
                  onClick={() => router.push('/dashboard/smart-upload')}
                  className="mt-3 text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  Create optimized listing →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}