'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Navigation from '../components/Navigation';
import CreditDisplay from '../components/CreditDisplay';
import EbayConnection from '../components/EbayConnection';
import { useUserData } from '../hooks/useUserData';
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

  // Aggressive compression for API (smaller than display)
  const compressImageForAPI = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Much smaller for API - 800px max
          let width = img.width;
          let height = img.height;
          const maxSize = 800;
          
          if (width > height && width > maxSize) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width / height) * maxSize;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with low quality for API
          canvas.toBlob((blob) => {
            if (blob && blob.size < 300000) { // Keep under 300KB
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              // If still too large, compress more
              canvas.toBlob((smallerBlob) => {
                const smallerFile = new File([smallerBlob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(smallerFile);
              }, 'image/jpeg', 0.5);
            }
          }, 'image/jpeg', 0.7);
        };
        img.onerror = () => reject(new Error('Image load failed'));
      };
      reader.onerror = () => reject(new Error('File read failed'));
    });
  };

  // Compress for display (better quality)
  const compressImageForDisplay = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Larger for display - 1200px max
          let width = img.width;
          let height = img.height;
          const maxSize = 1200;
          
          if (width > height && width > maxSize) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width / height) * maxSize;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          const preview = canvas.toDataURL('image/jpeg', 0.85);
          resolve(preview);
        };
        img.onerror = () => reject(new Error('Image load failed'));
      };
      reader.onerror = () => reject(new Error('File read failed'));
    });
  };

  // Handle file selection
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    console.log('Files selected:', files.length);

    try {
      const processedImages = [];
      
      for (const file of files) {
        try {
          // Create display version
          const preview = await compressImageForDisplay(file);
          
          // Create compressed version for API
          const compressedFile = await compressImageForAPI(file);
          
          processedImages.push({
            preview: preview,
            file: compressedFile,
            originalFile: file,
            name: file.name
          });
          
          console.log(`Processed ${file.name}: Display size: ${preview.length}, API size: ${compressedFile.size}`);
        } catch (err) {
          console.error('Error processing file:', file.name, err);
        }
      }
      
      console.log('Processed images:', processedImages.length);
      setUploadedImages(processedImages);
      setError(null);
      setAnalysisResult(null);
    } catch (error) {
      console.error('Error processing images:', error);
      setError('Failed to process images. Please try again.');
    }
  };

  // Handle new listing button click
  const handleNewListing = () => {
    console.log('New listing clicked');
    
    // Reset state
    setUploadedImages([]);
    setAnalysisResult(null);
    setError(null);
    
    // Trigger file input click
    if (fileInputRef.current) {
      console.log('Clicking file input');
      fileInputRef.current.click();
    } else {
      console.error('File input ref not found');
    }
  };

  // Handle analysis
  const handleAnalyze = async () => {
    console.log('Starting analysis...');
    
    if (!user || uploadedImages.length === 0) {
      setError('Please select images to analyze');
      return;
    }

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
      
      // Add compressed images to FormData
      uploadedImages.forEach((img, index) => {
        console.log(`Adding image ${index}: ${img.name}, size: ${img.file.size}`);
        formData.append('images', img.file);
      });

      // Log total size
      let totalSize = 0;
      uploadedImages.forEach(img => totalSize += img.file.size);
      console.log(`Total upload size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

      console.log('Sending request to /api/analyze-ai');

      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);

      if (response.status === 413) {
        throw new Error('Images are too large. Please try with fewer or smaller images.');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server error: ' + text.substring(0, 100));
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      console.log('Analysis result:', data);
      
      setAnalysisResult(data);
      await refreshUser(); // Refresh credit count
      
      // Show success message
      showNotification('Analysis complete! Review your listing below.', 'success');
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.message || 'Failed to analyze images. Please try again.');
    } finally {
      setIsAnalyzing(false);
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
          style={{ display: 'none' }}
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
                  <p><span className="font-medium">Title:</span> {analysisResult.title || analysisResult.ebayTitle}</p>
                  <p><span className="font-medium">Brand:</span> {analysisResult.brand}</p>
                  <p><span className="font-medium">Category:</span> {analysisResult.category || analysisResult.itemType}</p>
                  <p><span className="font-medium">Size:</span> {analysisResult.size}</p>
                  <p><span className="font-medium">Condition:</span> {analysisResult.condition}</p>
                  <p><span className="font-medium">Suggested Price:</span> {formatPrice(analysisResult.price || analysisResult.minPrice)}</p>
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
                    onClick={() => router.push('/history')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    View All Listings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}