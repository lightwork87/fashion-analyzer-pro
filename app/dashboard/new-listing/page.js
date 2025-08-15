// app/dashboard/new-listing/page.js
// FIXED VERSION - With image compression to avoid 413 errors

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

  // Compress image before converting to base64
  const compressImage = (file, maxWidth = 1024, maxHeight = 1024, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = height * (maxWidth / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = width * (maxHeight / height);
              height = maxHeight;
            }
          }
          
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          canvas.toBlob(
            (blob) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            },
            'image/jpeg',
            quality
          );
        };
        
        img.onerror = reject;
        img.src = e.target.result;
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setProgress('Compressing images...');

    try {
      // Compress all images
      const compressedImages = [];
      let totalSize = 0;
      
      for (let i = 0; i < images.length; i++) {
        setProgress(`Compressing image ${i + 1} of ${images.length}...`);
        
        try {
          const compressed = await compressImage(images[i].file);
          compressedImages.push(compressed);
          
          // Calculate size (base64 length * 3/4 for approximate bytes)
          const sizeInBytes = (compressed.length * 3) / 4;
          totalSize += sizeInBytes;
          
          // If total size is getting too large, compress more aggressively
          if (totalSize > 3 * 1024 * 1024 && i < images.length - 1) { // 3MB limit
            setProgress('Images too large, applying additional compression...');
            // Re-compress remaining images with lower quality
            for (let j = 0; j <= i; j++) {
              const recompressed = await compressImage(images[j].file, 800, 800, 0.5);
              compressedImages[j] = recompressed;
            }
            totalSize = compressedImages.reduce((sum, img) => sum + (img.length * 3) / 4, 0);
          }
        } catch (err) {
          console.error(`Failed to compress image ${i + 1}:`, err);
          throw new Error(`Failed to process image ${i + 1}`);
        }
      }

      // Check final size
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      console.log(`Total payload size: ${totalSizeMB}MB`);
      
      if (totalSize > 4 * 1024 * 1024) { // 4MB limit
        throw new Error(`Images too large (${totalSizeMB}MB). Please use fewer or smaller images.`);
      }

      setProgress('Analyzing images...');

      // Make API call
      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: compressedImages
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (!data.success || !data.analysis) {
        throw new Error('Invalid response from server');
      }

      // Success - store and navigate
      sessionStorage.setItem('analysisResult', JSON.stringify(data.analysis));
      router.push('/dashboard/listing-results');

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze images. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setProgress('');
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
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Progress Message */}
      {progress && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          {progress}
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">Upload Images</h2>
          <p className="text-sm text-gray-600">
            Upload up to 24 images of your item. Large images will be automatically compressed.
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
          <p className="text-xs text-gray-500 mt-2">
            Maximum 24 images • JPEG, PNG supported
          </p>
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
              {progress || 'Analyzing...'}
            </>
          ) : (
            'Analyze Images'
          )}
        </button>
      </div>
    </div>
  );
}