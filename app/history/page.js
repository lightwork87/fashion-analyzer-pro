'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, formatPriceRange } from '../utils/currency';

HistoryPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  // States
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, draft, active, sold
  const [filterDateRange, setFilterDateRange] = useState('all'); // all, today, week, month
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, price-high, price-low
  const [selectedListings, setSelectedListings] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    drafts: 0,
    active: 0,
    sold: 0
  });
  
  // Load listings from localStorage on mount
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    
    // Load drafts from localStorage
    const savedDrafts = JSON.parse(localStorage.getItem('lightlister_drafts') || '[]');
    
    // Load analysis history from localStorage (if any)
    const analysisHistory = JSON.parse(localStorage.getItem('lightlister_history') || '[]');
    
    // Combine all listings
    const allListings = [
      ...savedDrafts.map(draft => ({
        ...draft,
        status: draft.status || 'draft',
        source: 'draft'
      })),
      ...analysisHistory.map(item => ({
        ...item,
        status: item.status || 'analyzed',
        source: 'analysis'
      }))
    ];
    
    // Remove duplicates based on ID
    const uniqueListings = Array.from(
      new Map(allListings.map(item => [item.id, item])).values()
    );
    
    setListings(uniqueListings);
    updateStats(uniqueListings);
  }, [isLoaded, isSignedIn]);
  
  // Update filtered listings when filters change
  useEffect(() => {
    let filtered = [...listings];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(listing => 
        listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(listing => listing.status === filterStatus);
    }
    
    // Date filter
    if (filterDateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filterDateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(listing => {
        const listingDate = new Date(listing.savedAt || listing.createdAt);
        return listingDate >= filterDate;
      });
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.savedAt || b.createdAt) - new Date(a.savedAt || a.createdAt);
        case 'oldest':
          return new Date(a.savedAt || a.createdAt) - new Date(b.savedAt || b.createdAt);
        case 'price-high':
          return (b.price || b.estimatedPrice?.mid || 0) - (a.price || a.estimatedPrice?.mid || 0);
        case 'price-low':
          return (a.price || a.estimatedPrice?.mid || 0) - (b.price || b.estimatedPrice?.mid || 0);
        default:
          return 0;
      }
    });
    
    setFilteredListings(filtered);
  }, [listings, searchTerm, filterStatus, filterDateRange, sortBy]);
  
  // Update stats
  const updateStats = (listingsArray) => {
    const stats = {
      total: listingsArray.length,
      drafts: listingsArray.filter(l => l.status === 'draft').length,
      active: listingsArray.filter(l => l.status === 'active').length,
      sold: listingsArray.filter(l => l.status === 'sold').length
    };
    setStats(stats);
  };
  
  // Toggle selection
  const toggleSelection = (id) => {
    const newSelection = new Set(selectedListings);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedListings(newSelection);
  };
  
  // Select all
  const selectAll = () => {
    if (selectedListings.size === filteredListings.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(filteredListings.map(l => l.id)));
    }
  };
  
  // Duplicate listing
  const duplicateListing = (listing) => {
    const newListing = {
      ...listing,
      id: Date.now() + Math.random(),
      title: `${listing.title} (Copy)`,
      sku: `${listing.sku}-COPY`,
      status: 'draft',
      savedAt: new Date().toISOString()
    };
    
    const updatedListings = [newListing, ...listings];
    setListings(updatedListings);
    
    // Save to localStorage
    const drafts = updatedListings.filter(l => l.status === 'draft');
    localStorage.setItem('lightlister_drafts', JSON.stringify(drafts));
    
    updateStats(updatedListings);
    
    // Show success message
    showSuccessMessage('Listing duplicated successfully!');
  };
  
  // Edit listing (redirect to dashboard with data)
  const editListing = (listing) => {
    // Store listing data in sessionStorage for dashboard to pick up
    sessionStorage.setItem('editListing', JSON.stringify(listing));
    router.push('/dashboard');
  };
  
  // Delete listing
  const deleteListing = (id) => {
    setListingToDelete(id);
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = () => {
    if (listingToDelete) {
      const updatedListings = listings.filter(l => l.id !== listingToDelete);
      setListings(updatedListings);
      
      // Update localStorage
      const drafts = updatedListings.filter(l => l.status === 'draft');
      localStorage.setItem('lightlister_drafts', JSON.stringify(drafts));
      
      updateStats(updatedListings);
      setSelectedListings(new Set());
      
      showSuccessMessage('Listing deleted successfully!');
    }
    
    setShowDeleteConfirm(false);
    setListingToDelete(null);
  };
  
  // Bulk delete
  const bulkDelete = () => {
    const toDelete = Array.from(selectedListings);
    const updatedListings = listings.filter(l => !toDelete.includes(l.id));
    setListings(updatedListings);
    
    // Update localStorage
    const drafts = updatedListings.filter(l => l.status === 'draft');
    localStorage.setItem('lightlister_drafts', JSON.stringify(drafts));
    
    updateStats(updatedListings);
    setSelectedListings(new Set());
    
    showSuccessMessage(`${toDelete.length} listings deleted successfully!`);
  };
  
  // Show success message
  const showSuccessMessage = (message) => {
    const messageEl = document.createElement('div');
    messageEl.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    setTimeout(() => messageEl.remove(), 3000);
  };
  
  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);
  
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <Image 
                  src="/logo.png" 
                  alt="LightLister AI" 
                  width={32} 
                  height={32}
                  className="h-8 w-auto mr-3"
                />
                <h1 className="text-xl font-bold text-gray-900">Listing History</h1>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                New Listing
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Stats Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Listings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.drafts}</div>
              <div className="text-sm text-gray-600">Drafts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.sold}</div>
              <div className="text-sm text-gray-600">Sold</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by title, brand, SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Drafts</option>
                <option value="active">Active</option>
                <option value="sold">Sold</option>
              </select>
              
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
              </select>
              
              {/* View Toggle */}
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                  title="Grid view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                  title="List view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedListings.size > 0 && (
            <div className="mt-4 flex items-center justify-between bg-blue-50 rounded-md p-3">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedListings.size === filteredListings.length && filteredListings.length > 0}
                  onChange={selectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {selectedListings.size} selected
                </span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={bulkDelete}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No listings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterDateRange !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Get started by creating your first listing'}
            </p>
            {listings.length === 0 && (
              <div className="mt-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Listing
                </Link>
              </div>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Selection and Status Badge */}
                <div className="relative">
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={selectedListings.has(listing.id)}
                      onChange={() => toggleSelection(listing.id)}
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="absolute top-3 right-3 z-10">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      listing.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                      listing.status === 'active' ? 'bg-green-100 text-green-700' :
                      listing.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {listing.status}
                    </span>
                  </div>
                  
                  {/* Image */}
                  <div className="h-48 bg-gray-100">
                    {listing.images && listing.images.length > 0 && listing.images[0].preview ? (
                      <img
                        src={listing.images[0].preview}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Details */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate">
                    {listing.title || 'Untitled'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {listing.brand || 'No brand'} • {listing.size || 'No size'}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-2">
                    {formatPrice(listing.price || listing.estimatedPrice?.mid || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    SKU: {listing.sku || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(listing.savedAt || listing.createdAt).toLocaleDateString()}
                  </p>
                  
                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => editListing(listing)}
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      title="Edit"
                    >
                      <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => duplicateListing(listing)}
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      title="Duplicate"
                    >
                      <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteListing(listing.id)}
                      className="flex-1 px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                      title="Delete"
                    >
                      <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedListings.size === filteredListings.length && filteredListings.length > 0}
                      onChange={selectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        checked={selectedListings.has(listing.id)}
                        onChange={() => toggleSelection(listing.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {listing.images && listing.images.length > 0 && listing.images[0].preview ? (
                            <img
                              className="h-10 w-10 rounded object-cover"
                              src={listing.images[0].preview}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {listing.title || 'Untitled'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {listing.brand || 'No brand'} • {listing.size || 'No size'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {listing.sku || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(listing.price || listing.estimatedPrice?.mid || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        listing.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                        listing.status === 'active' ? 'bg-green-100 text-green-700' :
                        listing.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(listing.savedAt || listing.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => editListing(listing)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => duplicateListing(listing)}
                        className="text-gray-600 hover:text-gray-900 mr-3"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => deleteListing(listing.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Listing?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this listing? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setListingToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;