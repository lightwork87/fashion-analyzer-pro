'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ListingCard from './ListingCard';
import CreditDisplay from '../components/CreditDisplay';

export default function EnhancedDashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  // States
  const [activeView, setActiveView] = useState('grid'); // grid or list
  const [selectedListings, setSelectedListings] = useState(new Set());
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    platform: 'all',
    category: 'all',
    priceRange: 'all',
    dateRange: 'all',
    search: ''
  });

  // Stats
  const stats = useMemo(() => {
    return {
      total: listings.length,
      active: listings.filter(l => l.status === 'active').length,
      sold: listings.filter(l => l.status === 'sold').length,
      draft: listings.filter(l => l.status === 'draft').length,
      revenue: listings.filter(l => l.status === 'sold').reduce((sum, l) => sum + (l.price || 0), 0),
      avgPrice: listings.length > 0 ? listings.reduce((sum, l) => sum + (l.price || 0), 0) / listings.length : 0
    };
  }, [listings]);

  // Load saved drafts as listings (temporary until you have a backend)
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const savedDrafts = JSON.parse(localStorage.getItem('lightlister_drafts') || '[]');
      const formattedListings = savedDrafts.map(draft => ({
        ...draft,
        status: 'draft',
        platforms: ['ebay', 'vinted'],
        listedOn: [],
        createdAt: draft.savedAt || new Date().toISOString()
      }));
      setListings(formattedListings);
      setFilteredListings(formattedListings);
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  // Apply filters
  useEffect(() => {
    let filtered = [...listings];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(l => l.status === filters.status);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(l => 
        l.title?.toLowerCase().includes(searchLower) ||
        l.brand?.toLowerCase().includes(searchLower) ||
        l.sku?.toLowerCase().includes(searchLower)
      );
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(l => {
        const price = l.price || 0;
        if (max) {
          return price >= min && price <= max;
        } else {
          return price >= min;
        }
      });
    }

    setFilteredListings(filtered);
  }, [filters, listings]);

  // Handle selection
  const handleSelectListing = (id, isSelected) => {
    const newSelection = new Set(selectedListings);
    if (isSelected) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedListings(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedListings.size === filteredListings.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(filteredListings.map(l => l.id)));
    }
  };

  // Bulk actions
  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedListings.size} listings?`)) {
      const remaining = listings.filter(l => !selectedListings.has(l.id));
      setListings(remaining);
      setSelectedListings(new Set());
      // Update localStorage
      localStorage.setItem('lightlister_drafts', JSON.stringify(remaining));
    }
  };

  const handleBulkStatusChange = (newStatus) => {
    const updated = listings.map(l => 
      selectedListings.has(l.id) ? { ...l, status: newStatus } : l
    );
    setListings(updated);
    setSelectedListings(new Set());
  };

  // Individual actions
  const handleEdit = (listing) => {
    // Navigate to edit page or open edit modal
    console.log('Edit listing:', listing);
  };

  const handleDelete = (listing) => {
    if (window.confirm(`Delete "${listing.title}"?`)) {
      const remaining = listings.filter(l => l.id !== listing.id);
      setListings(remaining);
      localStorage.setItem('lightlister_drafts', JSON.stringify(remaining));
    }
  };

  const handleDuplicate = (listing) => {
    const duplicate = {
      ...listing,
      id: Date.now(),
      title: `${listing.title} (Copy)`,
      sku: `${listing.sku}-COPY`,
      status: 'draft',
      listedOn: [],
      createdAt: new Date().toISOString()
    };
    const updated = [...listings, duplicate];
    setListings(updated);
    localStorage.setItem('lightlister_drafts', JSON.stringify(updated));
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${showFilters ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r overflow-hidden`}>
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <Image 
              src="/logo.png" 
              alt="LightLister AI" 
              width={32} 
              height={32}
              className="h-8 w-auto"
            />
            <h1 className="text-xl font-bold text-gray-900">LightLister AI</h1>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 mb-8">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>All Listings</span>
            </Link>
            
            <Link href="/dashboard/active" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Active</span>
              <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">{stats.active}</span>
            </Link>
            
            <Link href="/dashboard/drafts" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Drafts</span>
              <span className="ml-auto bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">{stats.draft}</span>
            </Link>
            
            <Link href="/dashboard/sold" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Sold</span>
              <span className="ml-auto bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">{stats.sold}</span>
            </Link>
          </nav>

          {/* Filters */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Filters</h3>
            
            {/* Status Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="sold">Sold</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            {/* Platform Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
              <select
                value={filters.platform}
                onChange={(e) => setFilters({...filters, platform: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Platforms</option>
                <option value="ebay">eBay</option>
                <option value="vinted">Vinted</option>
                <option value="depop">Depop</option>
                <option value="poshmark">Poshmark</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select
                value={filters.priceRange}
                onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Prices</option>
                <option value="0-25">£0 - £25</option>
                <option value="25-50">£25 - £50</option>
                <option value="50-100">£50 - £100</option>
                <option value="100-200">£100 - £200</option>
                <option value="200-0">£200+</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => setFilters({
                status: 'all',
                platform: 'all',
                category: 'all',
                priceRange: 'all',
                dateRange: 'all',
                search: ''
              })}
              className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              Clear All Filters
            </button>
          </div>

          {/* Credit Display */}
          <div className="border-t pt-6 mt-6">
            <CreditDisplay compact />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-80"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setActiveView('grid')}
                  className={`px-3 py-1.5 text-sm font-medium rounded ${
                    activeView === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setActiveView('list')}
                  className={`px-3 py-1.5 text-sm font-medium rounded ${
                    activeView === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Add New Listing */}
              <Link
                href="/dashboard/new"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Listing
              </Link>

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-3 border-l">
                <span className="text-sm text-gray-600">
                  {user.firstName || user.emailAddresses[0].emailAddress}
                </span>
                <SignOutButton>
                  <button className="text-sm text-gray-600 hover:text-gray-900">
                    Sign Out
                  </button>
                </SignOutButton>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="grid grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Listings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.sold}</p>
              <p className="text-sm text-gray-600">Sold</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              <p className="text-sm text-gray-600">Drafts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">£{stats.revenue.toFixed(0)}</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">£{stats.avgPrice.toFixed(0)}</p>
              <p className="text-sm text-gray-600">Avg. Price</p>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedListings.size > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedListings.size} item{selectedListings.size > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedListings(new Set())}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear selection
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkStatusChange('active')}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Mark as Active
                </button>
                <button
                  onClick={() => handleBulkStatusChange('sold')}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Mark as Sold
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 text-sm bg-white border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto" style={{ height: 'calc(100vh - 250px)' }}>
          {/* Select All */}
          <div className="mb-4 flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedListings.size === filteredListings.length && filteredListings.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Select all</span>
            </label>
            
            <span className="text-sm text-gray-600">
              Showing {filteredListings.length} of {listings.length} listings
            </span>
          </div>

          {/* Listings Grid/List */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading listings...</p>
              </div>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No listings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search || filters.status !== 'all' ? 'Try adjusting your filters' : 'Get started by creating a new listing'}
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Listing
                </Link>
              </div>
            </div>
          ) : (
            <div className={activeView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
              {filteredListings.map((listing) => (
                activeView === 'grid' ? (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onSelect={handleSelectListing}
                    isSelected={selectedListings.has(listing.id)}
                  />
                ) : (
                  // List view (simplified for now)
                  <div key={listing.id} className="bg-white border rounded-lg p-4 flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedListings.has(listing.id)}
                      onChange={(e) => handleSelectListing(listing.id, e.target.checked)}
                      className="w-4 h-4"
                    />
                    <img
                      src={listing.images?.[0]?.preview || listing.images?.[0] || '/placeholder.png'}
                      alt={listing.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{listing.title || 'Untitled'}</h3>
                      <p className="text-sm text-gray-600">{listing.brand} • {listing.size}</p>
                    </div>
                    <span className="font-semibold">£{listing.price || 0}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      listing.status === 'active' ? 'bg-green-100 text-green-800' :
                      listing.status === 'sold' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {listing.status}
                    </span>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}