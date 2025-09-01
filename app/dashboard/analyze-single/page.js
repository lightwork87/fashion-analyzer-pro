// app/dashboard/analyze-single/page.js - COMPLETE REWRITE
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useCredits } from '@/app/contexts/CreditsContext';
import { compressImage } from '@/app/lib/imageCompression';

export default function AnalyzeSinglePage() {
  const router = useRouter();
  const { credits, updateCredits } = useCredits();
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError('');
    const newImages = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload only image files');
        continue;
      }

      try {
        // Compress the image before creating preview
        console.log(`Compressing ${file.name}...`);
        const compressedFile = await compressImage(file, 1200, 1200, 0.7);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push({
            id: Math.random().toString(36).substr(2, 9),
            file: compressedFile,
            preview: e.target.result,
            name: file.name,
            size: compressedFile.size,
            originalSize: file.size
          });
          
          if (newImages.length === files.length) {
            setImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        setError(`Failed to process ${file.name}`);
      }
    }
  }, []);

  const removeImage = useCallback((id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const uploadImages = async () => {
    const uploadedUrls = [];
    
    for (const image of images) {
      try {
        setUploadProgress(prev => ({ ...prev, [image.id]: 0 }));
        
        const formData = new FormData();
        formData.append('file', image.file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        uploadedUrls.push(data.url);
        
        setUploadProgress(prev => ({ ...prev, [image.id]: 100 }));
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    }
    
    return uploadedUrls;
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    if (credits < 1) {
      setError('Insufficient credits. Please purchase more credits to continue.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Upload all images first
      console.log('Uploading images...');
      const imageUrls = await uploadImages();
      
      if (imageUrls.length === 0) {
        throw new Error('No images were uploaded successfully');
      }

      setUploading(false);
      setAnalyzing(true);

      // Call analyze API
      console.log('Analyzing images...');
      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrls })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const analysisResult = await response.json();
      
      // Deduct credit
      await updateCredits(credits - 1);
      
      // Store in session storage and redirect
      sessionStorage.setItem('analysisResult', JSON.stringify(analysisResult));
      sessionStorage.setItem('analysisImages', JSON.stringify(imageUrls));
      
      router.push('/dashboard/results');
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.message || 'Failed to analyze images. Please try again.');
    } finally {
      setUploading(false);
      setAnalyzing(false);
      setUploadProgress({});
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect({ target: { files } });
  }, [handleFileSelect]);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Single Item Analysis
        </h1>
        <p className="text-gray-600">
          Upload photos of your fashion item for instant AI analysis
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Credits remaining:</strong> {credits} • 
            <strong> Cost:</strong> 1 credit per analysis
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Upload Area */}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {images.length === 0 ? (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Drag and drop your images here, or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports JPG, PNG, WEBP (Max 10 images)
            </p>
            <label className="inline-block">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                Select Images
              </span>
            </label>
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {uploadProgress[image.id] !== undefined && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 rounded-b-lg">
                      <div className="h-1 bg-blue-500 rounded-b-lg transition-all" 
                           style={{ width: `${uploadProgress[image.id]}%` }} />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
                    {(image.size / 1024).toFixed(0)}KB
                    {image.originalSize !== image.size && (
                      <span className="text-green-400">
                        {' '}(was {(image.originalSize / 1024).toFixed(0)}KB)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <label className="inline-block">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer">
                Add More Images
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {images.length > 0 && (
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleAnalyze}
            disabled={uploading || analyzing || credits < 1}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Uploading Images...
              </>
            ) : analyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Analyze Item (1 Credit)
              </>
            )}
          </button>
          
          <button
            onClick={() => setImages([])}
            disabled={uploading || analyzing}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Tips for best results:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Take photos in good lighting</li>
          <li>• Include front, back, and label shots</li>
          <li>• Show any defects or unique features</li>
          <li>• Images will be automatically compressed for faster upload</li>
        </ul>
      </div>
    </div>
  );
}