'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Camera, Upload, X, Loader2, ArrowLeft, Info } from 'lucide-react';

export default function AnalyzeSinglePage() {
  const { userId } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    // Define newImages properly - this was the bug!
    const newImages = files.slice(0, 24).map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    
    setImages(prev => [...prev, ...newImages].slice(0, 24));
    setError(null);
  };

  const removeImage = (id) => {
    const image = images.find(img => img.id === id);
    if (image?.preview) {
      URL.revokeObjectURL(image.preview);
    }
    setImages(images.filter(img => img.id !== id));
  };

  const uploadImage = async (file, userId) => {
    // Simple upload simulation - replace with your actual upload logic
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      // Return a temporary URL for demo purposes
      return URL.createObjectURL(file);
    }
  };

  const analyzeItem = async () => {
    if (!images.length) return;
    
    setIsAnalyzing(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // Upload images to storage
      const uploadedUrls = [];
      
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(Math.round((i / images.length) * 50));
        const url = await uploadImage(images[i].file, userId);
        uploadedUrls.push(url);
      }
      
      setUploadProgress(75);
      
      // Call AI analysis with enhanced fashion terms
      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls: uploadedUrls })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }
      
      if (data.success && data.analysis) {
        setUploadProgress(100);
        
        // Extract essential data for results page
        const essentialData = {
          id: data.analysis.id,
          ebay_title: data.analysis.ebay_title,
          brand: data.analysis.brand,
          item_type: data.analysis.item_type,
          neckline: data.analysis.neckline,
          sleeve_type: data.analysis.sleeve_type,
          silhouette: data.analysis.silhouette,
          size: data.analysis.size,
          color: data.analysis.color,
          condition_score: data.analysis.condition_score,
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
          fashion_terms_used: data.analysis.fashion_terms_used
        };
        
        // Store in sessionStorage with fallback
        try {
          sessionStorage.setItem('analysisResult', JSON.stringify(essentialData));
          router.push('/dashboard/results');
        } catch (storageError) {
          console.error('Storage error:', storageError);
          // If storage fails, pass ID in URL instead
          router.push(`/dashboard/results?id=${data.analysis.id}`);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze item');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
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
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Single Item Analysis</h1>
          <p className="text-gray-600 mt-2">
            Upload photos of one item for AI-powered listing creation with professional fashion terms
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Tips for best results:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Include clear photos of brand labels and size tags</li>
                <li>Show any flaws or wear from multiple angles</li>
                <li>Use good lighting and neutral backgrounds</li>
                <li>Upload up to 24 photos for comprehensive analysis</li>
                <li>AI will use professional fashion terminology (jewel neckline, A-line silhouette, etc.)</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {images.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition"
            >
              <Camera className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Click to upload photos or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG up to 10MB each
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(image.id)}
                      disabled={isAnalyzing}
                      className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {images.length < 24 && !isAnalyzing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                  </button>
                )}
              </div>
              
              {isAnalyzing && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Processing with fashion terminology...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {images.length} photo{images.length !== 1 ? 's' : ''} selected
                </p>
                
                <button
                  onClick={analyzeItem}
                  disabled={isAnalyzing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing with Fashion Terms...
                    </>
                  ) : (
                    'Analyze with Professional AI'
                  )}
                </button>
              </div>
            </>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}