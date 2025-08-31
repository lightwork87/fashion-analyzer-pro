// app/dashboard/analyze-single/page.js
// COMPLETE UPDATED VERSION WITH NEW API ENDPOINT

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  ArrowLeft, 
  Info,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react';
import { uploadImage } from '../../lib/storage';

export default function AnalyzeSinglePage() {
  const { userId } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    // Validate file types and sizes
    const validFiles = [];
    const errors = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        errors.push(`${file.name} is too large (max 10MB)`);
        continue;
      }
      validFiles.push(file);
    }
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      setTimeout(() => setError(null), 5000);
    }
    
    // Add valid images (max 24 total)
    const newImage = validFiles.slice(0, 24 - images.length).map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));
    
    setImages(prev => [...prev, ...newImages].slice(0, 24));
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (id) => {
    const image = images.find(img => img.id === id);
    if (image?.preview) {
      URL.revokeObjectURL(image.preview);
    }
    setImages(images.filter(img => img.id !== id));
    setError(null);
  };

  const analyzeItem = async () => {
    if (!images.length) {
      setError('Please upload at least one image');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setUploadProgress(0);
    setStatusMessage('Uploading images...');
    
    try {
      // Step 1: Upload images to storage
      const uploadedUrls = [];
      const totalImage = images.length;
      
      for (let i = 0; i < totalImages; i++) {
        setUploadProgress(Math.round((i / totalImages) * 40));
        setStatusMessage(`Uploading image ${i + 1} of ${totalImages}...`);
        
        try {
          const url = await uploadImage(images[i].file, userId || 'temp-user');
          uploadedUrls.push(url);
        } catch (uploadError) {
          console.error(`Failed to upload image ${i + 1}:`, uploadError);
          throw new Error(`Failed to upload image ${images[i].name}`);
        }
      }
      
      setUploadProgress(50);
      setStatusMessage('Analyzing with AI...');
      
      // Step 2: Call the NEW consolidated API endpoint
      const response = await fetch('/api/analyze', {  // CHANGED FROM /api/analyze-ai
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrls: uploadedUrls,
          imageCount: uploadedUrls.length
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Analysis failed (${response.status})`);
      }
      
      if (data.success && data.analysis) {
        setUploadProgress(90);
        setStatusMessage('Analysis complete! Redirecting...');
        
        // Extract essential data for results page
        const essentialData = {
          id: data.analysis.id,
          ebay_title: data.analysis.ebay_title,
          vinted_title: data.analysis.vinted_title,
          brand: data.analysis.brand,
          item_type: data.analysis.item_type,
          size: data.analysis.size,
          color: data.analysis.color,
          condition_score: data.analysis.condition_score,
          condition_text: data.analysis.condition_text,
          estimated_value_min: data.analysis.estimated_value_min,
          estimated_value_max: data.analysis.estimated_value_max,
          suggested_price: data.analysis.suggested_price,
          category: data.analysis.category,
          description: data.analysis.description,
          sku: data.analysis.sku,
          material: data.analysis.material,
          style: data.analysis.style,
          gender: data.analysis.gender,
          keywords: data.analysis.keywords,
          credits_remaining: data.analysis.credits_remaining,
          image_urls: uploadedUrls,
          images_count: uploadedUrls.length
        };
        
        // Store in sessionStorage
        try {
          sessionStorage.setItem('analysisResult', JSON.stringify(essentialData));
          setUploadProgress(100);
          
          // Navigate to results page
          setTimeout(() => {
            router.push('/dashboard/results');
          }, 500);
          
        } catch (storageError) {
          console.error('Storage error:', storageError);
          // Fallback: pass minimal data in URL
          router.push(`/dashboard/results?id=${data.analysis.id}`);
        }
      } else {
        throw new Error('Invalid response from analysis service');
      }
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze item. Please try again.');
      setStatusMessage('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect({ target: { files } });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
    };
  }, [images]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition"
            disabled={isAnalyzing}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Single Item Analysis</h1>
          <p className="text-gray-600 mt-2">
            Upload photos of one item for AI-powered listing creation
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Tips for best results:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Include clear photos of brand labels and size tags</li>
                <li>Show any flaws or wear from multiple angles</li>
                <li>Use good lighting and neutral backgrounds</li>
                <li>Upload up to 24 photos for comprehensive analysis</li>
                <li>First photo should show the item clearly</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {images.length === 0 ? (
            <div
              onClick={() => !isAnalyzing && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition"
            >
              <Camera className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Click to upload photos or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, JPEG, WEBP up to 10MB each
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Maximum 24 photos
              </p>
            </div>
          ) : (
            <>
              {/* Image Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={image.preview}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removeImage(image.id)}
                      disabled={isAnalyzing}
                      className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition">
                      {Math.round(image.size / 1024)}KB
                    </div>
                  </div>
                ))}
                
                {/* Add More Button */}
                {images.length < 24 && !isAnalyzing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Add More</span>
                  </button>
                )}
              </div>
              
              {/* Progress Bar */}
              {isAnalyzing && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{statusMessage}</span>
                    <span className="text-gray-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Action Bar */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{images.length}</span> photo{images.length !== 1 ? 's' : ''} selected
                  {images.length === 24 && (
                    <span className="text-orange-600 ml-2">(Maximum reached)</span>
                  )}
                </div>
                
                <button
                  onClick={analyzeItem}
                  disabled={isAnalyzing || images.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>
            </>
          )}
          
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isAnalyzing}
            className="hidden"
          />
        </div>

        {/* Credits Notice */}
        <div className="mt-6 text-center text-sm text-gray-500">
          This analysis will use 1 credit
        </div>
      </div>
    </div>
  );
}