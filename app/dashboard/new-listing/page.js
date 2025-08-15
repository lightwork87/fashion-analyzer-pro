// app/dashboard/new-listing/page.js
// DEBUG VERSION - Better error display

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';

export default function NewListingPage() {
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState({});
  const router = useRouter();

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 24) {
      setError('Maximum 24 images allowed per listing');
      return;
    }

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));

    setImages([...images, ...newImages]);
    setError('');
  };

  const removeImage = (id) => {
    setImages(images.filter(img => img.id !== id));
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleAnalyze = async () => {
    console.log('=== STARTING ANALYSIS ===');
    
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setDebugInfo({});

    try {
      // Convert images to base64
      console.log('Converting images to base64...');
      const base64Images = await Promise.all(
        images.map(img => convertToBase64(img.file))
      );
      console.log(`Converted ${base64Images.length} images`);

      // Make API call
      console.log('Calling /api/analyze-ai...');
      const startTime = Date.now();
      
      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: base64Images
        }),
      });

      const responseTime = Date.now() - startTime;
      console.log(`API responded in ${responseTime}ms with status: ${response.status}`);

      // Get response data
      const data = await response.json();
      console.log('API Response:', data);

      // Update debug info
      setDebugInfo({
        status: response.status,
        ok: response.ok,
        responseTime: `${responseTime}ms`,
        success: data.success,
        hasAnalysis: !!data.analysis,
        error: data.error,
        details: data.details
      });

      // Check response
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (!data.success || !data.analysis) {
        throw new Error('Invalid response structure - missing analysis data');
      }

      // Success - store and navigate
      console.log('Success! Storing result and navigating...');
      sessionStorage.setItem('analysisResult', JSON.stringify(data.analysis));
      router.push('/dashboard/listing-results');

    } catch (err) {
      console.error('=== ANALYSIS ERROR ===');
      console.error('Error:', err);
      
      // Set detailed error message
      let errorMessage = err.message || 'Failed to analyze images';
      
      // Add more context based on error type
      if (err.message.includes('fetch')) {
        errorMessage = 'Network error - could not reach server';
      } else if (err.message.includes('401')) {
        errorMessage = 'Authentication error - please sign in again';
      } else if (err.message.includes('402')) {
        errorMessage = 'No credits remaining - please purchase more';
      }
      
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold">Create New Listing</h1>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 font-medium">Error: {error}</div>
          {Object.keys(debugInfo).length > 0 && (
            <details className="mt-2">
              <summary className="text-sm text-red-600 cursor-pointer">Debug Info</summary>
              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">Upload Images</h2>
          <p className="text-sm text-gray-600">
            Upload up to 24 images of your item. The AI will analyze them to create your listing.
          </p>
        </div>

        {/* Drop Zone */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Click to browse for images</p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
            disabled={isAnalyzing}
          />
          <label
            htmlFor="image-upload"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select Images
          </label>
        </div>

        {/* Image Preview Grid */}
        {images.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-3">
              {images.length} image{images.length !== 1 ? 's' : ''} selected
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.preview}
                    alt="Upload preview"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isAnalyzing}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Link
          href="/dashboard"
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </Link>
        <div className="flex items-center gap-4">
          {/* Test API Button */}
          <Link
            href="/api/test"
            target="_blank"
            className="text-sm text-blue-600 hover:underline"
          >
            Test API Connection
          </Link>
          
          <button
            onClick={handleAnalyze}
            disabled={images.length === 0 || isAnalyzing}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Images'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}