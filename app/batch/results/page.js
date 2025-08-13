'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, formatPriceRange } from '../../utils/currency';

export default function BatchResultsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  // States
  const [groupedItems, setGroupedItems] = useState([]);
  const [processedListings, setProcessedListings] = useState([]);
  const [currentProcessing, setCurrentProcessing] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('idle'); // idle, processing, complete, error
  const [selectedListings, setSelectedListings] = useState(new Set());
  const [editingListing, setEditingListing] = useState(null);
  const [error, setError] = useState(null);
  const [creditInfo, setCreditInfo] = useState(null);
  
  // Load grouped items on mount
  useEffect(() => {
    const stored = localStorage.getItem('batchGroups');
    if (stored) {
      const groups = JSON.parse(stored);
      setGroupedItems(groups);
    } else {
      router.push('/batch');
    }
  }, [router]);
  
  // Process all groups with AI
  const processAllGroups = async () => {
    setProcessingStatus('processing');
    setError(null);
    
    const results = [];
    
    for (let i = 0; i < groupedItems.length; i++) {
      const group = groupedItems[i];
      setCurrentProcessing(i);
      
      try {
        // Prepare images for AI analysis
        const formData = new FormData();
        group.images.forEach((img, index) => {
          // Convert base64 to blob
          const base64Response = await fetch(img.preview);
          const blob = await base64Response.blob();
          const file = new File([blob], img.name || `image${index}.jpg`, { type: 'image/jpeg' });
          formData.append(`image${index}`, file);
        });
        
        // Call AI analysis
        const response = await fetch('/api/analyze-ai', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          if (data.type === 'INSUFFICIENT_CREDITS') {
            setError(`Insufficient credits. You need ${data.creditsNeeded} credits but have ${data.creditsAvailable}.`);
            setCreditInfo(data);
            setProcessingStatus('error');
            break;
          }
          throw new Error(data.error || 'Analysis failed');
        }
        
        if (data.creditInfo) {
          setCreditInfo(data.creditInfo);
        }
        
        // Create listing from AI results
        const listing = {
          id: `listing-${Date.now()}-${i}`,
          groupId: group.id,
          images: group.images,
          status: 'draft',
          ...data.items[0], // AI results
          originalGroupName: group.name
        };
        
        results.push(listing);
        setProcessedListings(prev => [...prev, listing]);
        
      } catch (error) {
        console.error('Error processing group:', error);
        // Create a basic listing even if AI fails
        const basicListing = {
          id: `listing-${Date.now()}-${i}`,
          groupId: group.id,
          images: group.images,
          status: 'draft',
          title: `${group.name} - Fashion Item`,
          brand: { name: 'Unknown' },
          category: 'Fashion',
          condition: { score: 7, description: 'Good' },
          estimatedPrice: { min: 10, mid: 20, max: 30 },
          description: 'Fashion item - please add description',
          originalGroupName: group.name,
          error: error.message
        };
        results.push(basicListing);
        setProcessedListings(prev => [...prev, basicListing]);
      }
      
      // Small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setProcessingStatus('complete');
    setCurrentProcessing(null);
    
    // Clear the stored groups
    localStorage.removeItem('batchGroups');
  };
  
  // Auto-start processing on load
  useEffect(() => {
    if (groupedItems.length > 0 && processingStatus === 'idle') {
      processAllGroups();
    }
  }, [groupedItems]);
  
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
    if (selectedListings.size === processedListings.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(processedListings.map(l => l.id)));
    }
  };
  
  // Save listing edits
  const saveListingEdits = (listingId, updates) => {
    setProcessedListings(prev => prev.map(listing => 
      listing.id === listingId ? { ...listing, ...updates } : listing
    ));
    setEditingListing(null);
  };
  
  // Bulk actions
  const bulkSaveDrafts = () => {
    const selected = processedListings.filter(l => selectedListings.has(l.id));
    const existingDrafts = JSON.parse(localStorage.getItem('lightlister_drafts') || '[]');
    
    selected.forEach(listing => {
      const draft = {
        id: Date.now() + Math.random(),
        title: listing.title || listing.ebayTitle || '',
        category: listing.category || listing.itemType || '',
        brand: listing.brand?.name || '',
        size: listing.size?.value || '',
        sizeType: listing.size?.type || 'UK',
        condition: listing.condition?.description || 'Good',
        description: listing.description || '',
        price: listing.estimatedPrice?.mid || '',
        sku: listing.sku || `BATCH-${Date.now()}`,
        images: listing.images,
        savedAt: new Date().toISOString()
      };
      existingDrafts.unshift(draft);
    });
    
    // Keep only last 50 drafts
    const trimmed = existingDrafts.slice(0, 50);
    localStorage.setItem('lightlister_drafts', JSON.stringify(trimmed));
    
    alert(`${selected.length} listings saved as drafts!`);
    setSelectedListings(new Set());
  };
  
  const bulkListOnEbay = () => {
    // TODO: Implement eBay bulk listing
    alert('eBay bulk listing coming soon! This will list all selected items on eBay.');
  };
  
  const bulkListOnVinted = () => {
    // TODO: Implement Vinted bulk listing
    alert('Vinted bulk listing coming soon! This will list all selected items on Vinted.');
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
                <h1 className="text-xl font-bold text-gray-900">Batch Processing Results</h1>
              </Link>
              <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                BETA
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {creditInfo && (
                <span className="text-sm text-gray-600">
                  Credits: {creditInfo.creditsRemaining} / {creditInfo.totalCredits}
                </span>
              )}
              <Link 
                href="/batch"
                className="text-sm bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                New Batch
              </Link>
              <Link 
                href="/dashboard"
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Processing Status */}
      {processingStatus === 'processing' && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-700">
                  Processing item {(currentProcessing || 0) + 1} of {groupedItems.length}...
                </span>
              </div>
              <div className="text-sm text-blue-600">
                {processedListings.length} completed
              </div>
            </div>
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(processedListings.length / groupedItems.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {processingStatus === 'complete' && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-700">
                Successfully processed {processedListings.length} items!
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <p className="text-red-700">{error}</p>
              {creditInfo && (
                <Link 
                  href="/pricing"
                  className="text-sm bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Get More Credits
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bulk Actions */}
        {processedListings.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedListings.size === processedListings.length && processedListings.length > 0}
                  onChange={selectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {selectedListings.size > 0 
                    ? `${selectedListings.size} selected`
                    : 'Select all'
                  }
                </span>
              </div>
              
              {selectedListings.size > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={bulkSaveDrafts}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                    </svg>
                    Save as Drafts
                  </button>
                  <button
                    onClick={bulkListOnEbay}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    List on eBay ({selectedListings.size})
                  </button>
                  <button
                    onClick={bulkListOnVinted}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    List on Vinted ({selectedListings.size})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedListings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Selection and Images */}
              <div className="relative">
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedListings.has(listing.id)}
                    onChange={() => toggleSelection(listing.id)}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                
                {/* Image Carousel */}
                <div className="relative h-64 bg-gray-100">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0].preview}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {listing.images && listing.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {listing.images.length} photos
                    </div>
                  )}
                  
                  {listing.error && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      AI Error
                    </div>
                  )}
                </div>
              </div>
              
              {/* Listing Details */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {listing.title || listing.ebayTitle || 'Untitled Item'}
                </h3>
                
                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <div className="flex justify-between">
                    <span>Brand:</span>
                    <span className="font-medium text-gray-900">
                      {listing.brand?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="font-medium text-gray-900">
                      {listing.size?.value || 'One size'} {listing.size?.type && `(${listing.size.type})`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Condition:</span>
                    <span className="font-medium text-gray-900">
                      {listing.condition?.description || 'Good'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Price:</span>
                    <span className="font-medium text-gray-900">
                      {formatPriceRange(
                        listing.estimatedPrice?.min || 10,
                        listing.estimatedPrice?.max || 30
                      )}
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingListing(listing)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* No results yet */}
        {processingStatus === 'idle' && processedListings.length === 0 && groupedItems.length > 0 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Preparing to process {groupedItems.length} items...</p>
            <p className="text-sm text-gray-500 mt-2">This will use {groupedItems.length} credits</p>
          </div>
        )}
        
        {/* Empty state */}
        {groupedItems.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items to process</h3>
            <p className="mt-1 text-sm text-gray-500">Upload some photos to get started.</p>
            <div className="mt-6">
              <Link
                href="/batch"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Upload Photos
              </Link>
            </div>
          </div>
        )}
      </main>
      
      {/* Edit Modal */}
      {editingListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Listing</h2>
              <button
                onClick={() => setEditingListing(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editingListing.title || editingListing.ebayTitle || ''}
                  onChange={(e) => setEditingListing({...editingListing, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={editingListing.brand?.name || ''}
                    onChange={(e) => setEditingListing({
                      ...editingListing, 
                      brand: { ...editingListing.brand, name: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ({formatPrice('')})</label>
                  <input
                    type="number"
                    value={editingListing.estimatedPrice?.mid || ''}
                    onChange={(e) => setEditingListing({
                      ...editingListing,
                      estimatedPrice: {
                        ...editingListing.estimatedPrice,
                        mid: parseFloat(e.target.value) || 0,
                        min: Math.floor(parseFloat(e.target.value) * 0.8) || 0,
                        max: Math.ceil(parseFloat(e.target.value) * 1.2) || 0
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <input
                    type="text"
                    value={editingListing.size?.value || ''}
                    onChange={(e) => setEditingListing({
                      ...editingListing,
                      size: { ...editingListing.size, value: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select
                    value={editingListing.condition?.description || 'Good'}
                    onChange={(e) => setEditingListing({
                      ...editingListing,
                      condition: { ...editingListing.condition, description: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="New with tags">New with tags</option>
                    <option value="New without tags">New without tags</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingListing.description || ''}
                  onChange={(e) => setEditingListing({...editingListing, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => saveListingEdits(editingListing.id, editingListing)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingListing(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}