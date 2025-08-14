'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Navigation from '../components/Navigation';
import CreditDisplay from '../components/CreditDisplay';
import EbayConnection from '../components/EbayConnection';
import useUserData from '../hooks/useUserData';
import imageCompression from 'browser-image-compression';
import { formatPrice } from '../utils/currency';

export default function Dashboard() {
  const { userId } = useAuth();
  const { user, loading, refreshUser } = useUserData();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [recentListings, setRecentListings] = useState([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    totalRevenue: 0
  });
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');

  // Load recent listings and stats
  useEffect(() => {
    if (userId) {
      loadRecentListings();
      loadUserStats();
    }
  }, [userId]);

  const loadRecentListings = async () => {
    try {
      const response = await fetch('/api/listings/recent');
      if (response.ok) {
        const data = await response.json();
        setRecentListings(data.listings || []);
      }
    } catch (error) {
      console.error('Error loading recent listings:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const compressedImages = [];
      
      for (const file of files) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        
        const base64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(compressedFile);
        });
        
        compressedImages.push({
          preview: base64,
          file: compressedFile,
          name: file.name
        });
      }
      
      setUploadedImages(compressedImages);
      setError(null);
      setAnalysisResult(null);
    } catch (error) {
      console.error('Error processing images:', error);
      setError('Failed to process images. Please try again.');
    }
  };

  // Handle new listing button click
  const handleNewListing = () => {
    // Reset state
    setUploadedImages([]);
    setAnalysisResult(null);
    setError(null);
    
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle analysis
  const handleAnalyze = async () => {
    if (!user || uploadedImages.length === 0) return;

    // Check credits
    const totalCredits = (user.credits_total || 0) + (user.bonus_credits || 0);
    const creditsRemaining = totalCredits - (user.credits_used || 0);
    
    if (creditsRemaining < 1) {
      setError('Insufficient credits. Please purchase more credits to continue.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      uploadedImages.forEach((img, index) => {
        formData.append(`images`, img.file);
      });

      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysisResult(data);
      await refreshUser(); // Refresh credit count
      
      // Show success message
      showNotification('Analysis complete! Review your listing below.', 'success');
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.message || 'Failed to analyze images');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save as draft
  const handleSaveAsDraft = async () => {
    if (!analysisResult || !draftTitle) return;

    try {
      const response = await fetch('/api/listings/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...analysisResult,
          title: draftTitle,
          isDraft: true
        }),
      });

      if (response.ok) {
        showNotification('Draft saved successfully!', 'success');
        setShowDraftModal(false);
        loadRecentListings();
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      showNotification('Failed to save draft', 'error');
    }
  };

  // List to eBay
  const handleListToEbay = async () => {
    if (!analysisResult) return;

    try {
      const response = await fetch('/api/ebay/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisResult),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Successfully listed to eBay!', 'success');
        router.push(`/listing/${data.listingId}`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error listing to eBay:', error);
      showNotification(error.message || 'Failed to list to eBay', 'error');
    }
  };

  // Remove image
  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'error' ? 'bg-red-500 text-white' : 
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back! Ready to list some items?
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Listings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalListings}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Active Listings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeListings}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Items Sold</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.soldListings}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">{formatPrice(stats.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Credits Card */}
          <CreditDisplay user={user} />
          
          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleNewListing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Listing
                </div>
              </button>
              <button
                onClick={() => router.push('/batch')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Batch Upload
                </div>
              </button>
              <button
                onClick={() => router.push('/history')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View History
                </div>
              </button>
            </div>
          </div>
          
          {/* eBay Connection */}
          <EbayConnection userId={userId} />
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />

        {/* Image upload area (if images selected) */}
        {uploadedImages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Selected Images ({uploadedImages.length})
              </h3>
              <button
                onClick={() => setUploadedImages([])}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear All
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image.preview}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Add More Images
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !user || uploadedImages.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </div>
                ) : (
                  `Analyze (1 Credit)`
                )}
              </button>
            </div>
          </div>
        )}

        {/* Analysis Result */}
        {analysisResult && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Analysis Complete!</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Item Details</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Title:</span> {analysisResult.title}</p>
                  <p><span className="font-medium">Brand:</span> {analysisResult.brand}</p>
                  <p><span className="font-medium">Category:</span> {analysisResult.category}</p>
                  <p><span className="font-medium">Size:</span> {analysisResult.size}</p>
                  <p><span className="font-medium">Condition:</span> {analysisResult.condition}</p>
                  <p><span className="font-medium">Suggested Price:</span> {formatPrice(analysisResult.price)}</p>
                  <p><span className="font-medium">SKU:</span> {analysisResult.sku}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Description</h4>
                <p className="text-sm text-gray-600 mb-4">{analysisResult.description}</p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => router.push(`/listing/${analysisResult.id}/edit`)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Edit Listing
                  </button>
                  <button
                    onClick={() => setShowDraftModal(true)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Save as Draft
                  </button>
                  <button
                    onClick={handleListToEbay}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    List to eBay
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Listings */}
        {recentListings.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Listings</h3>
              <button
                onClick={() => router.push('/history')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {recentListings.slice(0, 5).map((listing) => (
                <div key={listing.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{listing.title}</p>
                    <p className="text-sm text-gray-600">
                      {listing.brand} • {listing.size} • {formatPrice(listing.price)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      listing.status === 'active' ? 'bg-green-100 text-green-800' :
                      listing.status === 'sold' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {listing.status}
                    </span>
                    <button
                      onClick={() => router.push(`/listing/${listing.id}`)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Draft Modal */}
        {showDraftModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Save as Draft</h3>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Enter a title for this draft"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDraftModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAsDraft}
                  disabled={!draftTitle}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Save Draft
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}