// app/dashboard/create-listing/page.js
// VERSION WITH TEST API - To isolate the issue

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';

export default function CreateListingPage() {
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const router = useRouter();

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      setError('Limited to 5 images');
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

  const handleAnalyze = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setDebugInfo('Starting analysis...');

    try {
      // First, test with the simple test API
      setDebugInfo('Calling test API...');
      
      const testResponse = await fetch('/api/analyze-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          imageCount: images.length
        }),
      });

      const testData = await testResponse.json();
      
      setDebugInfo(`Test API response: ${testResponse.status} - ${JSON.stringify(testData).substring(0, 100)}...`);

      if (!testResponse.ok) {
        throw new Error(`Test API failed: ${testData.error || testResponse.status}`);
      }

      if (testData.success) {
        // If test works, try the real API
        setDebugInfo('Test API works! Now trying real API...');
        
        // Convert first image only for testing
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(images[0].file);
        });

        const response = await fetch('/api/analyze-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: [base64]
          }),
        });

        const data = await response.json();
        
        setDebugInfo(`Real API response: ${response.status} - ${JSON.stringify(data).substring(0, 100)}...`);

        if (!response.ok) {
          // Use test data as fallback
          console.log('Real API failed, using test data');
          sessionStorage.setItem('analysisResult', JSON.stringify(testData.analysis));
          router.push('/dashboard/listing-results');
          return;
        }

        if (data.success && data.analysis) {
          sessionStorage.setItem('analysisResult', JSON.stringify(data.analysis));
          router.push('/dashboard/listing-results');
        } else {
          throw new Error('Invalid response from server');
        }
      }

    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to analyze images');
      setDebugInfo(`Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold">Create Listing (Debug Mode)</h1>
        </div>
      </div>

      {/* Debug Info */}
      {debugInfo && (
        <div className="mb-4 p-4 bg-gray-100 border border-gray-300 rounded-lg font-mono text-sm">
          {debugInfo}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">Upload Images</h2>
          <p className="text-sm text-gray-600">
            Testing with simple API first.
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            Select Images
          </label>
        </div>

        {images.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-3">
              {images.length} image{images.length !== 1 ? 's' : ''} selected
            </p>
            <div className="grid grid-cols-5 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.preview}
                    alt="Preview"
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

      <div className="flex justify-between">
        <Link
          href="/dashboard"
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          onClick={handleAnalyze}
          disabled={images.length === 0 || isAnalyzing}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Analysis'
          )}
        </button>
      </div>
    </div>
  );
}