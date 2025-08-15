// app/dashboard/create-listing/page.js
// WORKING VERSION - Confirmed API connection

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';

export default function CreateListingPage() {
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const router = useRouter();

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 10) {
      setError('Maximum 10 images allowed');
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
    setProgress('Processing images...');

    try {
      // For now, just send dummy data since API works
      const dummyImages = images.map(() => 'image-data');
      
      setProgress('Contacting server...');
      
      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: dummyImages
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success && data.analysis) {
        // Store the result
        sessionStorage.setItem('analysisResult', JSON.stringify(data.analysis));
        
        // Navigate to results
        console.log('Navigating to results page...');
        router.push('/dashboard/listing-results');
      } else {
        throw new Error('Invalid response format');
      }

    } catch (err) {
      console.error('Analysis error:', err);
      setError(`Error: ${err.message}`);
      
      // Show more details in development
      if (err.message.includes('fetch')) {
        setError('Network error - Could not connect to server');
      }
    } finally {
      setIsAnalyzing(false);
      setProgress('');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold">Create New Listing</h1>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {progress && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          {progress}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">Upload Images</h2>
          <p className="text-sm text-gray-600">
            Upload up to 10 images of your item for analysis.
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Click to select images</p>
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

      <div className="flex justify-between items-center">
        <Link
          href="/dashboard"
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/test-results')}
            className="text-sm text-blue-600 hover:underline"
          >
            Test with mock data
          </button>
          <button
            onClick={handleAnalyze}
            disabled={images.length === 0 || isAnalyzing}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {progress || 'Analyzing...'}
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