// app/dashboard/analyze-bulk/page.js
// FIXED VERSION - REACT IMPORT CORRECTED

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, Upload, X, Loader2, Crown, Sparkles, Info, AlertCircle } from 'lucide-react';

export default function AnalyzeBulkPage() {
  const { userId } = useAuth();
  const router = useRouter();
  
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    // Limit to 600 images (25 items × 24 photos max)
    const newImages = files.slice(0, 600).map((file, index) => ({
      id: Date.now() + index,
      file: file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    
    setImages(prev => [...prev, ...newImages].slice(0, 600));
    setError(null);
  };

  const removeImage = (id) => {
    const image = images.find(img => img.id === id);
    if (image?.preview) {
      URL.revokeObjectURL(image.preview);
    }
    setImages(images.filter(img => img.id !== id));
  };

  const processBulkAnalysis = async () => {
    if (images.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    
    try {
      // For now, show coming soon message
      setProgress(50);
      
      setTimeout(() => {
        setProgress(100);
        setError('Bulk analysis is coming soon! Currently in development.');
        setIsProcessing(false);
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Analysis failed');
      setIsProcessing(false);
    }
  };

  // Cleanup on unmount - FIXED: properly imported useEffect
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
    };
  }, [images]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center space-x-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Bulk Analysis</h1>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center space-x-1">
              <Crown className="w-4 h-4" />
              <span>Pro Feature</span>
            </span>
          </div>
          <p className="text-gray-600">Process up to 25 items with 24 photos each</p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">How Bulk Analysis Works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Upload up to 600 photos (25 items × 24 photos each)</li>
                <li>AI automatically groups photos by item</li>
                <li>Each group gets analyzed for brand, size, condition</li>
                <li>Generate 25 professional eBay listings at once</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {images.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Your Photos
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Select up to 600 photos for batch analysis
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="bulk-upload"
              />
              <label
                htmlFor="bulk-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </label>
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG up to 10MB each
              </p>
            </div>
          ) : (
            <>
              {/* Image Grid */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Selected Photos ({images.length})
                  </h3>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="add-more"
                  />
                  <label
                    htmlFor="add-more"
                    className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Add More
                  </label>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-96 overflow-y-auto">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.preview}
                        alt={image.name}
                        className="w-full h-16 object-cover rounded border"
                      />
                      <button
                        onClick={() => removeImage(image.id)}
                        disabled={isProcessing}
                        className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                        style={{ fontSize: '10px' }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Processing bulk analysis...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Analysis Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Analysis Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Photos:</span>
                    <span className="ml-2 font-medium">{images.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Estimated Items:</span>
                    <span className="ml-2 font-medium">{Math.ceil(images.length / 6)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Credits Needed:</span>
                    <span className="ml-2 font-medium">{Math.ceil(images.length / 6)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Est. Time:</span>
                    <span className="ml-2 font-medium">{Math.ceil(images.length / 10)} min</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setImages([])}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Clear All
                </button>
                
                <button
                  onClick={processBulkAnalysis}
                  disabled={isProcessing || images.length === 0}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Start Bulk Analysis
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bulk Analysis Coming Soon!
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            We're working hard to bring you the ability to process up to 25 items at once with AI-powered photo grouping and analysis. This feature will save you hours of work!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Single Analysis
            </Link>
            <Link
              href="/dashboard/get-credits"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Get Notified
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}