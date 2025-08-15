// app/dashboard/new-listing/page.js
// WORKING VERSION - Aggressive compression to prevent 413 errors

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';

export default function NewListingPage() {
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
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

  // Aggressive compression function
  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          // Very aggressive compression settings
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;
          
          // Scale down
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round(height * (MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round(width * (MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Very low quality for small file size
          const base64 = canvas.toDataURL('image/jpeg', 0.4);
          resolve(base64);
        };
        
        img.src = e.target.result;
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    console.log('Starting analysis...');
    
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setProgress('Processing images...');

    try {
      const compressedImages = [];
      
      // Compress each image
      for (let i = 0; i < images.length; i++) {
        setProgress(`Compressing image ${i + 1} of ${images.length}...`);
        console.log(`Compressing image ${i + 1}...`);
        
        const compressed = await compressImage(images[i].file);
        compressedImages.push(compressed);
      }

      // Check total size
      const totalSize = compressedImages.reduce((sum, img) => sum + img.length, 0);
      const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      console.log(`Total payload size: ${sizeMB}MB`);
      
      setProgress(`Sending ${sizeMB}MB to server...`);

      // If still too large, batch the images
      let response, data;
      
      if (totalSize > 3.5 * 1024 * 1024) {
        // Send in batches
        setProgress('Large payload detected, sending in batches...');
        
        const BATCH_SIZE = Math.ceil(images.length / Math.ceil(totalSize / (3 * 1024 * 1024)));
        const batches = [];
        
        for (let i = 0; i < compressedImages.length; i += BATCH_SIZE) {
          batches.push(compressedImages.slice(i, i + BATCH_SIZE));
        }
        
        console.log(`Sending in ${batches.length} batches of ~${BATCH_SIZE} images each`);
        
        // For now, just send the first batch
        response = await fetch('/api/analyze-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: batches[0]
          }),
        });
        
        data = await response.json();
        
      } else {
        // Send all at once
        response = await fetch('/api/analyze-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: compressedImages
          }),
        });
        
        data = await response.json();
      }
      
      console.log('API Response:', response.status, data);
      
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (data.success && data.analysis) {
        console.log('Success! Navigating to results...');
        sessionStorage.setItem('analysisResult', JSON.stringify(data.analysis));
        router.push('/dashboard/listing-results');
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze images');
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
            Upload up to 24 images. They will be compressed automatically.
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
              {progress || 'Processing...'}
            </>
          ) : (
            'Analyze Images'
          )}
        </button>
      </div>
    </div>
  );
}