// app/dashboard/analyze-single/page.js - NEW FILE
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AnalyzeSinglePage() {
  const router = useRouter();
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to 24 images
    if (images.length + files.length > 24) {
      setError('Maximum 24 images allowed per item');
      return;
    }

    // Convert to base64 for preview
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, {
          file,
          preview: e.target.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    setError('');
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      // First upload images to Supabase
      const uploadedUrls = [];
      
      for (const img of images) {
        const formData = new FormData();
        formData.append('file', img.file);
        
        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }
        
        const { url } = await uploadResponse.json();
        uploadedUrls.push(url);
      }

      // Then analyze with AI
      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ images: uploadedUrls })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      
      // Redirect to results page
      router.push(`/dashboard/results?id=${result.analysisId}`);
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze item. Please try again.');
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Analyze Single Item</h1>
          <p className="text-gray-600 mt-1">Upload photos of your fashion item for AI analysis</p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Photos</h2>
          
          {/* Dropzone */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="file-upload"
              disabled={analyzing}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drop photos here or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Up to 24 photos • JPG, PNG, WEBP • Max 10MB each
              </p>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-3">
                {images.length} photo{images.length !== 1 ? 's' : ''} uploaded
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={analyzing}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Tips for Best Results</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Include clear photos of brand labels and tags</li>
            <li>• Show the entire item from different angles</li>
            <li>• Include size tags and care labels</li>
            <li>• Use good lighting and plain backgrounds</li>
            <li>• Include any defects or unique features</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Link
            href="/dashboard"
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          
          <button
            onClick={handleAnalyze}
            disabled={images.length === 0 || analyzing}
            className={`px-6 py-2 rounded-md font-medium flex items-center
              ${images.length === 0 || analyzing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            {analyzing ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Analyzing...
              </>
            ) : (
              'Analyze Item'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}