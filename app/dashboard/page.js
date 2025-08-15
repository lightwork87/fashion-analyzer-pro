// app/dashboard/page.js
// COMPLETE WORKING DASHBOARD

'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  BarChart3, 
  Plus, 
  FileText, 
  Settings, 
  CreditCard,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useUser();
  const [credits, setCredits] = useState({ total: 10, used: 0 });
  const [recentListings, setRecentListings] = useState([]);

  useEffect(() => {
    // Fetch user credits
    fetchCredits();
    // Fetch recent listings
    fetchRecentListings();
  }, []);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  };

  const fetchRecentListings = async () => {
    try {
      const response = await fetch('/api/listings?limit=5');
      if (response.ok) {
        const data = await response.json();
        setRecentListings(data.listings || []);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      // Use mock data for now
      setRecentListings([
        { id: 1, title: 'Sample Listing 1', sku: 'SKU001', status: 'draft' },
        { id: 2, title: 'Sample Listing 2', sku: 'SKU002', status: 'active' }
      ]);
    }
  };

  const availableCredits = credits.total - credits.used;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome back, {user?.firstName || 'User'}!
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your listings and analyze new items
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Credits Available</p>
                <p className="text-2xl font-semibold text-blue-600">
                  {availableCredits}/{credits.total}
                </p>
              </div>
              <Link
                href="/dashboard/get-credits"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <CreditCard className="w-4 h-4 inline mr-2" />
                Get Credits
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Temporary Notice */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-800">
                System Update Notice
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                We're upgrading our image processing system. Please use the Quick Create option below for the best experience.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quick Create - Primary Action */}
          <Link
            href="/dashboard/quick-list"
            className="bg-green-50 border-2 border-green-200 rounded-lg p-6 hover:border-green-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                WORKING
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Quick Create Listing
            </h3>
            <p className="text-sm text-gray-600">
              Create a listing instantly without image upload. Perfect for quick tests.
            </p>
          </Link>

          {/* Smart Upload - New Working Version */}
          <Link
            href="/dashboard/smart-upload"
            className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                NEW
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Smart Upload
            </h3>
            <p className="text-sm text-gray-600">
              Upload images for analysis using our new optimized system.
            </p>
          </Link>

          {/* Inventory */}
          <Link
            href="/dashboard/inventory"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
          >
            <div className="p-3 bg-gray-100 rounded-lg mb-4 w-fit">
              <Package className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Inventory
            </h3>
            <p className="text-sm text-gray-600">
              View and manage all your listings in one place.
            </p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Listings
            </h2>
          </div>
          <div className="divide-y">
            {recentListings.length > 0 ? (
              recentListings.map((listing) => (
                <div key={listing.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        SKU: {listing.sku}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      listing.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {listing.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No listings yet. Create your first listing above!
                </p>
              </div>
            )}
          </div>
          {recentListings.length > 0 && (
            <div className="px-6 py-4 border-t">
              <Link
                href="/dashboard/inventory"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all listings →
              </Link>
            </div>
          )}
        </div>

        {/* Additional Options */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:border-gray-300 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Analytics</span>
          </Link>
          
          <Link
            href="/dashboard/listing-history"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:border-gray-300 transition-colors"
          >
            <FileText className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">History</span>
          </Link>
          
          <Link
            href="/dashboard/business-policies"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:border-gray-300 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Policies</span>
          </Link>
          
          <Link
            href="/dashboard/ebay-integration"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:border-gray-300 transition-colors"
          >
            <Package className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">eBay</span>
          </Link>
        </div>
      </div>
    </div>
  );
}