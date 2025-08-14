'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserData } from '../hooks/useUserData';
import EbayConnection from '../components/EbayConnection';

export default function Dashboard() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { user, loading: userLoading } = useUserData();
  const fileInputRef = useRef(null);
  
  const [activeView, setActiveView] = useState('inventory');
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    soldItems: 0,
    revenue: 0,
    avgSalePrice: 0,
    listingsThisWeek: 0
  });
  const [selectedListings, setSelectedListings] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Business Policies
  const [businessPolicies, setBusinessPolicies] = useState({
    shipping: [],
    payment: [],
    returns: []
  });

  useEffect(() => {
    if (clerkUser) {
      loadListings();
      loadStats();
      loadBusinessPolicies();
    }
  }, [clerkUser]);

  const loadListings = async () => {
    try {
      const response = await fetch('/api/listings?limit=50');
      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      setListings([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/analytics/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadBusinessPolicies = async () => {
    try {
      const response = await fetch('/api/ebay/business-policies');
      if (response.ok) {
        const data = await response.json();
        setBusinessPolicies(data);
      }
    } catch (error) {
      console.error('Error loading business policies:', error);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImages(newImages);
  };

  const handleQuickAnalysis = async () => {
    if (images.length === 0 || !user || !clerkUser) return;

    const creditsNeeded = 1;
    const totalCredits = (user.credits_total || 0) + (user.bonus_credits || 0);
    const creditsRemaining = totalCredits - (user.credits_used || 0);

    if (creditsRemaining < creditsNeeded) {
      alert('Not enough credits. Please purchase more credits.');
      router.push('/pricing');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      images.forEach(img => {
        formData.append('images', img.file);
      });
      formData.append('userId', clerkUser.id);

      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      
      // Store the result and redirect to edit page
      sessionStorage.setItem('analysisResult', JSON.stringify(data));
      router.push('/dashboard/new-listing');

    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze images. Please try again.');
    } finally {
      setIsProcessing(false);
      setImages([]);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedListings.length === 0) return;

    switch (action) {
      case 'list-ebay':
        alert('Bulk eBay listing coming soon!');
        break;
      case 'list-vinted':
        exportVintedCSV(selectedListings);
        break;
      case 'delete':
        if (confirm(`Delete ${selectedListings.length} listings?`)) {
          alert('Delete functionality coming soon!');
        }
        break;
    }
  };

  const exportVintedCSV = (listingIds) => {
    const selectedItems = listings.filter(l => listingIds.includes(l.id));
    if (selectedItems.length === 0) {
      alert('No items selected for export');
      return;
    }
    
    const headers = ['Title', 'Brand', 'Size', 'Condition', 'Price', 'Category', 'Color', 'Description'];
    const rows = selectedItems.map(item => [
      item.title || '',
      item.brand || '',
      item.size || '',
      item.condition || '',
      item.price || '',
      item.category || '',
      item.color || '',
      (item.description || '').replace(/,/g, ';')
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vinted_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleListingAction = (listingId, action) => {
    switch (action) {
      case 'duplicate':
        alert('Duplicate functionality coming soon!');
        break;
      case 'edit':
        router.push(`/listing/${listingId}`);
        break;
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesStatus = filterStatus === 'all' || listing.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Clean up image previews
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white shadow-sm">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800">LightLister AI</h2>
          <p className="text-sm text-gray-600 mt-1">Professional Reselling Suite</p>
        </div>
        
        <nav className="mt-6">
          <button
            onClick={() => setActiveView('inventory')}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
              activeView === 'inventory' ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700' : 'text-gray-700'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            Inventory
          </button>

          <button
            onClick={() => setActiveView('analytics')}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
              activeView === 'analytics' ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700' : 'text-gray-700'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </button>

          <button
            onClick={() => setActiveView('list-new')}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
              activeView === 'list-new' ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700' : 'text-gray-700'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Listing
          </button>

          <Link
            href="/batch"
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Batch Processing
          </Link>

          <Link
            href="/history"
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Listing History
          </Link>

          <button
            onClick={() => setActiveView('policies')}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
              activeView === 'policies' ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700' : 'text-gray-700'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Business Policies
          </button>

          <Link
            href="/pricing"
            className="w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Get Credits
          </Link>

          <Link
            href="/beta"
            className="w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Beta Program
          </Link>
        </nav>

        {/* eBay Connection in Sidebar */}
        <div className="p-6 mt-auto">
          <EbayConnection userId={clerkUser?.id} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-800">
                {activeView === 'inventory' && 'Inventory Management'}
                {activeView === 'analytics' && 'Sales Analytics'}
                {activeView === 'list-new' && 'Create New Listing'}
                {activeView === 'policies' && 'Business Policies'}
              </h1>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/account')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Account Settings"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        {(activeView === 'inventory' || activeView === 'analytics') && (
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Listings</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalListings}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Listings</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeListings}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Items Sold</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.soldItems}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">£{stats.revenue.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory View */}
        {activeView === 'inventory' && (
          <div className="px-8 pb-8">
            {/* Action Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-4 w-full lg:w-auto">
                  <input
                    type="text"
                    placeholder="Search listings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full lg:w-64"
                  />
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="sold">Sold</option>
                    <option value="ended">Ended</option>
                  </select>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                      title="Grid View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                      title="List View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {selectedListings.length > 0 && (
                    <>
                      <span className="text-sm text-gray-600">
                        {selectedListings.length} selected
                      </span>
                      <button
                        onClick={() => handleBulkAction('list-ebay')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        List to eBay
                      </button>
                      <button
                        onClick={() => handleBulkAction('list-vinted')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Export for Vinted
                      </button>
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Listings Display */}
            {filteredListings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
                <p className="text-gray-600 mb-4">Create your first listing to get started</p>
                <button
                  onClick={() => setActiveView('list-new')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Listing
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredListings.map((listing) => (
                  <div key={listing.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-gray-100 relative">
                      {listing.images?.[0] && (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <input
                        type="checkbox"
                        checked={selectedListings.includes(listing.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedListings([...selectedListings, listing.id]);
                          } else {
                            setSelectedListings(selectedListings.filter(id => id !== listing.id));
                          }
                        }}
                        className="absolute top-2 left-2"
                      />
                      <span className={`absolute top-2 right-2 px-2 py-1 text-xs rounded ${
                        listing.status === 'active' ? 'bg-green-100 text-green-800' :
                        listing.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                        listing.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {listing.status || 'draft'}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 truncate">{listing.title || 'Untitled'}</h3>
                      <p className="text-sm text-gray-600 mt-1">{listing.brand || 'No brand'}</p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-lg font-bold">£{listing.price || '0'}</span>
                        <button
                          onClick={() => handleListingAction(listing.id, 'edit')}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedListings(filteredListings.map(l => l.id));
                            } else {
                              setSelectedListings([]);
                            }
                          }}
                          checked={selectedListings.length === filteredListings.length && filteredListings.length > 0}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Platform
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredListings.map((listing) => (
                      <tr key={listing.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedListings.includes(listing.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedListings([...selectedListings, listing.id]);
                              } else {
                                setSelectedListings(selectedListings.filter(id => id !== listing.id));
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {listing.images?.[0] && (
                                <img className="h-10 w-10 rounded-lg object-cover" src={listing.images[0]} alt="" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{listing.title || 'Untitled'}</div>
                              <div className="text-sm text-gray-500">{listing.brand || 'No brand'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {listing.sku || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          £{listing.price || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            listing.status === 'active' ? 'bg-green-100 text-green-800' :
                            listing.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                            listing.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {listing.status || 'draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {listing.platform || 'eBay'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleListingAction(listing.id, 'edit')}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleListingAction(listing.id, 'duplicate')}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Duplicate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div className="px-8 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16" />
                    </svg>
                    <p>Sales analytics coming soon</p>
                  </div>
                </div>
              </div>

              {/* Top Brands */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Top Performing Brands</h3>
                <div className="space-y-3">
                  <p className="text-center text-gray-400 py-8">No sales data yet</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Listing View */}
        {activeView === 'list-new' && (
          <div className="px-8 pb-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-xl font-semibold mb-6">Create New Listing</h2>
                
                {/* Quick Single Item Upload */}
                <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Quick Upload</h3>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="quick-upload"
                  />
                  
                  {images.length === 0 ? (
                    <label
                      htmlFor="quick-upload"
                      className="block w-full text-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer"
                    >
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-gray-600">Click to upload photos for quick analysis</p>
                      <p className="text-sm text-gray-500 mt-2">Upload up to 24 photos</p>
                    </label>
                  ) : (
                    <div>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        {images.map((img, idx) => (
                          <div key={idx} className="aspect-square relative">
                            <img src={img.preview} alt="" className="w-full h-full object-cover rounded-lg" />
                            <button
                              onClick={() => {
                                const newImages = [...images];
                                URL.revokeObjectURL(newImages[idx].preview);
                                newImages.splice(idx, 1);
                                setImages(newImages);
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleQuickAnalysis}
                        disabled={isProcessing}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {isProcessing ? 'Analyzing...' : 'Analyze with AI (1 credit)'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link
                    href="/dashboard/new-listing"
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
                  >
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium mb-2">Manual Entry</h3>
                    <p className="text-gray-600">Create listing manually</p>
                  </Link>

                  <Link
                    href="/batch"
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
                  >
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="text-lg font-medium mb-2">Batch Processing</h3>
                    <p className="text-gray-600">Process up to 25 items at once</p>
                  </Link>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Recent Drafts</h3>
                  {listings.filter(l => l.status === 'draft').length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No drafts yet</p>
                  ) : (
                    <div className="space-y-3">
                      {listings.filter(l => l.status === 'draft').slice(0, 5).map(draft => (
                        <div key={draft.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                          <div>
                            <p className="font-medium">{draft.title || 'Untitled Draft'}</p>
                            <p className="text-sm text-gray-600">Created {new Date(draft.created_at).toLocaleDateString()}</p>
                          </div>
                          <button
                            onClick={() => router.push(`/listing/${draft.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Continue
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Business Policies View */}
        {activeView === 'policies' && (
          <div className="px-8 pb-8">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
              <p className="text-yellow-800">
                Business policies sync with your eBay account. Connect your eBay account to manage policies.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Shipping Policies */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Shipping Policies</h3>
                <button className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add Shipping Policy
                </button>
                <div className="space-y-3">
                  {businessPolicies.shipping.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No shipping policies yet</p>
                  ) : (
                    businessPolicies.shipping.map((policy, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <p className="font-medium">{policy.name}</p>
                        <p className="text-sm text-gray-600">{policy.service} - £{policy.cost}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Payment Policies */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Payment Policies</h3>
                <button className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add Payment Policy
                </button>
                <div className="space-y-3">
                  {businessPolicies.payment.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No payment policies yet</p>
                  ) : (
                    businessPolicies.payment.map((policy, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <p className="font-medium">{policy.name}</p>
                        <p className="text-sm text-gray-600">{policy.methods.join(', ')}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Return Policies */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Return Policies</h3>
                <button className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add Return Policy
                </button>
                <div className="space-y-3">
                  {businessPolicies.returns.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No return policies yet</p>
                  ) : (
                    businessPolicies.returns.map((policy, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <p className="font-medium">{policy.name}</p>
                        <p className="text-sm text-gray-600">{policy.period} days - {policy.type}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}