'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ListingCard({ listing, onEdit, onDelete, onDuplicate, onSelect, isSelected }) {
  const [imageError, setImageError] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  
  // Platform icons mapping
  const platformIcons = {
    ebay: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.5 10c-1.5 0-3 1-3 2.5S5 15 6.5 15c1.2 0 2.2-.6 2.7-1.5H7.5v-1h3.5v.5c0 2.5-2 4.5-4.5 4.5S2 15.5 2 13s2-4.5 4.5-4.5c1.7 0 3.2 1 3.9 2.5h-1.6c-.5-.8-1.3-1.3-2.3-1.3z"/>
        <path d="M12 8.5h5c1.5 0 2.5 1 2.5 2.5s-1 2.5-2.5 2.5h-3.5v3h-1.5v-8zm1.5 1v3h3.5c.8 0 1-.5 1-1s-.2-1-1-1h-3.5z"/>
      </svg>
    ),
    vinted: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
      </svg>
    ),
    depop: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10"/>
      </svg>
    ),
    poshmark: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>
      </svg>
    )
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'sold':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getDaysListed = (createdAt) => {
    const days = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  return (
    <>
      <div className="group relative bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200">
        {/* Selection Checkbox */}
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(listing.id, e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>

        {/* Quick Actions (visible on hover) */}
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex gap-1 bg-white rounded-lg shadow-lg p-1">
            <button
              onClick={() => setShowQuickView(true)}
              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Quick View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={() => onEdit(listing)}
              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDuplicate(listing)}
              className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Duplicate"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(listing)}
              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Image */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
          {!imageError && listing.images?.[0] ? (
            <img
              src={listing.images[0].preview || listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Image count badge */}
          {listing.images?.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              {listing.images.length} photos
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-medium text-gray-900 truncate mb-2" title={listing.title}>
            {listing.title || 'Untitled Item'}
          </h3>

          {/* Price and Status Row */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-semibold text-gray-900">
              {formatPrice(listing.price || 0)}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(listing.status)}`}>
              {listing.status || 'draft'}
            </span>
          </div>

          {/* Item Details */}
          <div className="space-y-1 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Brand:</span>
              <span className="truncate">{listing.brand || 'No brand'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Size:</span>
              <span>{listing.size || 'One size'} {listing.sizeType && `(${listing.sizeType})`}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">SKU:</span>
              <span className="text-xs font-mono">{listing.sku}</span>
            </div>
          </div>

          {/* Platform Icons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {listing.platforms?.map((platform) => (
                <div
                  key={platform}
                  className={`p-1.5 rounded ${
                    listing.listedOn?.includes(platform)
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  title={`${listing.listedOn?.includes(platform) ? 'Listed on' : 'Not listed on'} ${platform}`}
                >
                  {platformIcons[platform] || platform.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            
            {/* Days Listed */}
            {listing.status === 'active' && (
              <span className="text-xs text-gray-500">
                {getDaysListed(listing.createdAt)}
              </span>
            )}
          </div>
        </div>

        {/* Hover Border Effect */}
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"></div>
      </div>

      {/* Quick View Modal */}
      {showQuickView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">{listing.title}</h2>
                <button
                  onClick={() => setShowQuickView(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Quick view content */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Images</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {listing.images?.map((image, index) => (
                      <img
                        key={index}
                        src={image.preview || image}
                        alt={`Image ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Price:</span> {formatPrice(listing.price)}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {listing.status}
                  </div>
                  <div>
                    <span className="font-medium">Brand:</span> {listing.brand}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span> {listing.size} {listing.sizeType}
                  </div>
                  <div>
                    <span className="font-medium">Condition:</span> {listing.condition}
                  </div>
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="text-sm text-gray-600 mt-1">{listing.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowQuickView(false);
                    onEdit(listing);
                  }}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Listing
                </button>
                <button
                  onClick={() => setShowQuickView(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}