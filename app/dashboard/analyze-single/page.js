// app/dashboard/analyze-single/page.js - COMPLETE ANALYZE SINGLE PAGE
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Upload, 
  X, 
  Camera, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';

export default function AnalyzeSinglePage() {
  const router = useRouter();
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files) => {
    const newImages = [];
    const maxFiles = 24 - images.length;
    
    for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          setError('Some files are too large. Maximum size is 10MB per image.');
          continue;
        }
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
          id: Date.now() + i
        });
      }
    }
    
    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
      setError('');
    }
  };

  const removeImage = (id) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const uploadToSupabase = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    return data.url;
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setAnalyzing(true);
    setError('');
    setUploadProgress(0);

    try {
      // Upload images first
      const uploadedUrls = [];
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(Math.round((i / images.length) * 50));
        const url = await uploadToSupabase(images[i].file);
        uploadedUrls.push(url);
      }

      setUploadProgress(50);

      // Call AI analysis
      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: uploadedUrls,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const result = await response.json();
      setUploadProgress(100);

      // Redirect to results page
      setTimeout(() => {
        router.push(`/dashboard/results?id=${result.analysisId}`);
      }, 500);

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze images. Please try again.');
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Analyze Single Item</h1>
          <p className="mt-2 text-gray-600">
            Upload photos of your fashion item for AI analysis and listing generation
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload Photos</h2>
            <p className="text-sm text-gray-600">
              Upload up to 24 photos. Include multiple angles, brand tags, size labels, and any flaws for best results.
            </p>
          </div>

          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            } ${images.length > 0 ? 'mb-6' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFiles(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={images.length >= 24}
            />
            
            <Camera className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm font-medium text-gray-900">
              {images.length >= 24 
                ? 'Maximum photos reached (24)'
                : 'Drop photos here or click to browse'
              }
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {24 - images.length} photos remaining • Max 10MB per image
            </p>
          </div>

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Uploaded Photos ({images.length})
                </h3>
                <button
                  onClick={() => {
                    images.forEach(img => URL.revokeObjectURL(img.preview));
                    setImages([]);
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove all
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.preview}
                      alt="Upload preview"
                      className="h-24 w-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="ml-3 text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Analysis Progress */}
          {analyzing && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Analyzing your item...
                  </p>
                  <div className="mt-2 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 transition-all duration-500"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-blue-700">
                    {uploadProgress < 50 
                      ? 'Uploading images...' 
                      : 'Processing with AI...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadProgress === 100 && !error && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <p className="ml-3 text-sm text-green-800">
                  Analysis complete! Redirecting to results...
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            
            <button
              onClick={handleAnalyze}
              disabled={images.length === 0 || analyzing}
              className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                images.length === 0 || analyzing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {analyzing ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Camera className="-ml-1 mr-2 h-5 w-5" />
                  Analyze Item (1 Credit)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📸 Photo Tips for Best Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">What to Include:</h4>
              <ul className="space-y-1">
                <li>• Front and back views</li>
                <li>• Brand labels and tags</li>
                <li>• Size labels</li>
                <li>• Close-ups of unique features</li>
                <li>• Any flaws or wear areas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Best Practices:</h4>
              <ul className="space-y-1">
                <li>• Use good lighting</li>
                <li>• Plain background preferred</li>
                <li>• Ensure labels are readable</li>
                <li>• Include measurements if possible</li>
                <li>• Show actual condition clearly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}