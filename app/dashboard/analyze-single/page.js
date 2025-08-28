'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Camera, Upload, X, Loader2, ArrowLeft, Info } from 'lucide-react';
import { uploadImage } from '../../lib/storage';

export default function AnalyzeSinglePage() {
  const { userId } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  // Image compression function
  const compressImage = (file, maxWidth = 800, quality = 0.4) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            console.log(`🖼️ Compressed: ${file.name} from ${Math.round(file.size/1024)}KB to ${Math.round(blob.size/1024)}KB`);
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    setError(null);
    
    try {
      const processedImages = [];
      
      for (let i = 0; i < Math.min(files.length, 24); i++) {
        const file = files[i];
        
        // Check file type
        if (!file.type.startsWith('image/')) {
          console.warn(`Skipping non-image file: ${file.name}`);
          continue;
        }
        
        // Compress the image
        const compressedBlob = await compressImage(file);
        
        // Create compressed file object
        const compressedFile = new File([compressedBlob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        processedImages.push({
          id: Date.now() + Math.random() + i,
          file: compressedFile,
          originalFile: file,
          preview: URL.createObjectURL(compressedBlob),
          name: file.name,
          originalSize: file.size,
          compressedSize: compressedFile.size
        });
      }
      
      setImages(prev => [...prev, ...processedImages].slice(0, 24));
      
      // Show compression summary
      const totalOriginal = processedImages.reduce((sum, img) => sum + img.originalSize, 0);
      const totalCompressed = processedImages.reduce((sum, img) => sum + img.compressedSize, 0);
      console.log(`📊 Total compression: ${Math.round(totalOriginal/1024)}KB → ${Math.round(totalCompressed/1024)}KB (${Math.round((1-totalCompressed/totalOriginal)*100)}% reduction)`);
      
    } catch (err) {
      setError(`Error processing images: ${err.message}`);
    }
  };

  const removeImage = (id) => {
    const image = images.find(img => img.id === id);
    if (image?.preview) {
      URL.revokeObjectURL(image.preview);
    }
    setImages(images.filter(img => img.id !== id));
  };

  const analyzeItem = async () => {
    if (!images.length) return;
    
    setIsAnalyzing(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // Calculate total size before upload
      const totalSize = images.reduce((sum, img) => sum + img.compressedSize, 0);
      console.log(`📤 Uploading ${images.length} images, total size: ${Math.round(totalSize/1024)}KB`);
      
      if (totalSize > 4000000) { // 4MB safety margin
        throw new Error(`Images too large (${Math.round(totalSize/1024)}KB). Please use fewer photos or reduce quality.`);
      }
      
      // Upload images to storage
      const uploadedUrls = [];
      
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(Math.round((i / images.length) * 50));
        const url = await uploadImage(images[i].file, userId);
        uploadedUrls.push(url);
        console.log(`✅ Uploaded ${i + 1}/${images.length}: ${images[i].name}`);
      }
      
      setUploadProgress(75);
      console.log(`🔗 All images uploaded, calling AI analysis...`);
      
      // Call AI analysis
      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrls: uploadedUrls,
          imageCount: images.length 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Analysis failed (${response.status})`);
      }
      
      if (data.success && data.analysis) {
        setUploadProgress(100);
        console.log('✅ Analysis complete:', data.analysis.ebay_title);
        
        // Extract only essential data for results page
        const essentialData = {
          id: data.analysis.id,
          ebay_title: data.analysis.ebay_title,
          brand: data.analysis.brand,
          item_type: data.analysis.item_type,
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
          images_count: images.length,
          analyzed_at: new Date().toISOString()
        };
        
        // Store in sessionStorage with smaller data
        try {
          const dataString = JSON.stringify(essentialData);
          if (dataString.length > 1000000) { // 1MB limit for sessionStorage
            throw new Error('Data too large for storage');
          }
          sessionStorage.setItem('analysisResult', dataString);
          router.push('/dashboard/results');
        } catch (storageError) {
          console.error('Storage error:', storageError);
          // If storage fails, pass ID in URL instead
          router.push(`/dashboard/results?id=${data.analysis.id}`);
        }
      } else {
        throw new Error('No analysis data returned');
      }
    } catch (err) {
      console.error('❌ Analysis error:', err);
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

  // Calculate total compressed size
  const totalSize = images.reduce((sum, img) => sum + img.compressedSize, 0);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

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
            Upload photos of one item for AI-powered listing creation
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
                <li>Images are automatically compressed to ensure fast processing</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Size Warning */}
        {totalSize > 3000000 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              ⚠️ Total size: {totalSizeMB}MB - Consider using fewer photos if upload fails
            </p>
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
                PNG, JPG up to 10MB each (automatically compressed)
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
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                      {Math.round(image.compressedSize / 1024)}KB
                    </div>
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
                    <span>Processing...</span>
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
                <div className="text-sm text-gray-600">
                  <p>{images.length} photo{images.length !== 1 ? 's' : ''} selected</p>
                  <p>Total size: {totalSizeMB}MB (compressed from {(images.reduce((sum, img) => sum + img.originalSize, 0) / 1024 / 1024).toFixed(2)}MB)</p>
                </div>
                
                <button
                  onClick={analyzeItem}
                  disabled={isAnalyzing || totalSize > 4000000}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze with AI'
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