'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Navigation from '../components/Navigation';
import CreditDisplay from '../components/CreditDisplay';
import EbayConnection from '../components/EbayConnection';

// Safe import with fallback
let useUserData;
try {
  const userDataModule = require('../hooks/useUserData');
  useUserData = userDataModule.useUserData || userDataModule.default || (() => ({ user: null, loading: false, refreshUser: () => {} }));
} catch (e) {
  console.error('Failed to import useUserData:', e);
  useUserData = () => ({ user: null, loading: false, refreshUser: () => {} });
}

// Safe formatPrice with fallback
const formatPrice = (price) => {
  try {
    if (typeof price === 'number') {
      return `£${price.toFixed(2)}`;
    }
    return `£${parseFloat(price || 0).toFixed(2)}`;
  } catch (e) {
    console.error('formatPrice error:', e);
    return `£0.00`;
  }
};

export default function Dashboard() {
  console.log('Dashboard component rendering');
  
  const { userId } = useAuth();
  const userData = useUserData();
  const { user, loading, refreshUser } = userData || {};
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [debugLog, setDebugLog] = useState([]);

  // Debug logging function
  const addDebugLog = (message) => {
    console.log(`[Dashboard Debug] ${message}`);
    setDebugLog(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    addDebugLog('Dashboard mounted');
    addDebugLog(`User ID: ${userId}`);
    addDebugLog(`User data: ${JSON.stringify(user)}`);
  }, []);

  // Safe file processing
  const processFile = async (file) => {
    addDebugLog(`Processing file: ${file?.name}`);
    
    if (!file || !(file instanceof File)) {
      addDebugLog('Invalid file object');
      return null;
    }

    try {
      // Read file as data URL
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result);
        reader.onerror = (e) => reject(new Error('FileReader error'));
        reader.readAsDataURL(file);
      });

      addDebugLog('File read successfully');

      // Create image
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Image load error'));
        image.src = dataUrl;
      });

      addDebugLog(`Image loaded: ${img.width}x${img.height}`);

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Resize
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

      // Convert to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.7);
      });

      if (!blob) {
        throw new Error('Blob creation failed');
      }

      const compressedFile = new File([blob], file.name, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      addDebugLog(`File compressed: ${compressedFile.size} bytes`);

      return {
        preview: dataUrl,
        file: compressedFile,
        name: file.name
      };
    } catch (error) {
      addDebugLog(`Error processing file: ${error.message}`);
      console.error('File processing error:', error);
      return null;
    }
  };

  // Handle file selection
  const handleFileSelect = async (e) => {
    addDebugLog('handleFileSelect called');
    
    try {
      const files = e?.target?.files;
      if (!files || files.length === 0) {
        addDebugLog('No files selected');
        return;
      }

      const fileArray = Array.from(files);
      addDebugLog(`Files selected: ${fileArray.length}`);

      setError(null);
      const processedImages = [];

      for (const file of fileArray) {
        const processed = await processFile(file);
        if (processed) {
          processedImages.push(processed);
        }
      }

      addDebugLog(`Processed images: ${processedImages.length}`);
      setUploadedImages(processedImages);
      setAnalysisResult(null);
    } catch (error) {
      addDebugLog(`File select error: ${error.message}`);
      console.error('File select error:', error);
      setError('Failed to process images. Please try again.');
    }
  };

  // Handle new listing button click
  const handleNewListing = () => {
    addDebugLog('New listing clicked');
    
    try {
      setUploadedImages([]);
      setAnalysisResult(null);
      setError(null);
      
      if (fileInputRef?.current) {
        addDebugLog('Clicking file input');
        fileInputRef.current.click();
      } else {
        addDebugLog('File input ref not found');
      }
    } catch (error) {
      addDebugLog(`New listing error: ${error.message}`);
      console.error('New listing error:', error);
    }
  };

  // Handle analysis
  const handleAnalyze = async () => {
    addDebugLog('Starting analysis');
    
    if (!user || !uploadedImages || uploadedImages.length === 0) {
      setError('Please select images to analyze');
      return;
    }

    // Safe credit calculation
    const totalCredits = (user?.credits_total || 0) + (user?.bonus_credits || 0);
    const creditsUsed = user?.credits_used || 0;
    const creditsRemaining = totalCredits - creditsUsed;
    
    addDebugLog(`Credits: ${creditsRemaining} remaining`);
    
    if (creditsRemaining < 1) {
      setError('Insufficient credits. Please purchase more credits to continue.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      
      // Safe image addition
      if (Array.isArray(uploadedImages)) {
        uploadedImages.forEach((img, index) => {
          if (img?.file) {
            formData.append('images', img.file);
            addDebugLog(`Added image ${index}: ${img.file.size} bytes`);
          }
        });
      }

      addDebugLog('Sending request to API');

      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        body: formData,
      });

      addDebugLog(`Response status: ${response.status}`);

      if (response.status === 413) {
        throw new Error('Images are too large. Please try with smaller images.');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error('Invalid response from server');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Analysis failed');
      }

      addDebugLog('Analysis successful');
      setAnalysisResult(data);
      
      if (typeof refreshUser === 'function') {
        await refreshUser();
      }
      
    } catch (error) {
      addDebugLog(`Analysis error: ${error.message}`);
      console.error('Analysis error:', error);
      setError(error.message || 'Failed to analyze images.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Safe remove image
  const removeImage = (index) => {
    try {
      if (Array.isArray(uploadedImages)) {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
      }
    } catch (error) {
      console.error('Remove image error:', error);
    }
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
        {/* Debug Panel - Remove in production */}
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <h4 className="font-bold mb-2">Debug Log:</h4>
          <div className="max-h-32 overflow-y-auto">
            {debugLog.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>

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
          {user && <CreditDisplay user={user} />}
          
          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleNewListing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                New Listing
              </button>
              <button
                onClick={() => router?.push('/batch')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Batch Upload
              </button>
              <button
                onClick={() => router?.push('/history')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                View History
              </button>
            </div>
          </div>
          
          {/* eBay Connection */}
          {userId && <EbayConnection userId={userId} />}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Image upload area */}
        {uploadedImages?.length > 0 && (
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
                    src={image?.preview}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={() => fileInputRef?.current?.click()}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Add More Images
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !user || uploadedImages.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze (1 Credit)'}
              </button>
            </div>
          </div>
        )}

        {/* Analysis Result */}
        {analysisResult && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Analysis Complete!</h3>
            <div className="space-y-2">
              <p><strong>Title:</strong> {analysisResult?.title || analysisResult?.ebayTitle}</p>
              <p><strong>Brand:</strong> {analysisResult?.brand}</p>
              <p><strong>Price:</strong> {formatPrice(analysisResult?.price || analysisResult?.minPrice)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}