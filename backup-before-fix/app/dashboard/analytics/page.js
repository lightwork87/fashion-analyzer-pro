// app/dashboard/analytics/page.js
// ANALYTICS DASHBOARD

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  TrendingUp, 
  Package, 
  PoundSterling,
  Eye,
  Calendar,
  Download,
  BarChart3
} from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('30d');
  const [stats, setStats] = useState({
    revenue: 2847.50,
    items_sold: 34,
    avg_price: 83.75,
    total_views: 3421,
    conversion_rate: 12.5,
    top_brands: ['Nike', 'Zara', 'Adidas', 'H&M', 'Unbranded'],
    sales_by_category: {
      "Women's Clothing": 45,
      "Men's Clothing": 30,
      "Shoes": 15,
      "Accessories": 10
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600 mt-2">
                Track your sales performance and insights
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="year">This year</option>
              </select>
              
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Revenue</span>
              <PoundSterling className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">£{stats.revenue}</p>
            <p className="text-sm text-green-600 mt-1">+12.5% vs last period</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Items Sold</span>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.items_sold}</p>
            <p className="text-sm text-blue-600 mt-1">+8 vs last period</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Average Price</span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">£{stats.avg_price}</p>
            <p className="text-sm text-gray-600 mt-1">Per item sold</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Conversion Rate</span>
              <Eye className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.conversion_rate}%</p>
            <p className="text-sm text-orange-600 mt-1">+2.3% vs last period</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Brands */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Brands</h3>
            <div className="space-y-3">
              {stats.top_brands.map((brand, index) => (
                <div key={brand} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{brand}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${100 - (index * 15)}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {30 - (index * 5)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
            <div className="space-y-3">
              {Object.entries(stats.sales_by_category).map(([category, percentage]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Placeholder for Chart */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Revenue chart visualization</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}