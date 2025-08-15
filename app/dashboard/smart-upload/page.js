// app/dashboard/smart-upload/page.js
// WORKING IMAGE UPLOAD - Doesn't send base64 data

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';

export default function SmartUploadPage() {
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 24) {
      setError('Maximum 24 images allowed per listing');
      return;
    }

    // Store files for preview only - don't convert to base64
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
      name: file.name
    }));

    setImages([...images, ...newImages]);
    setError('');
  };

  const removeImage = (id) => {
    const img = images.find(i => i.id === id);
    if (img) {
      URL.revokeObjectURL(img.preview); // Clean up memory
    }
    setImages(images.filter(img => img.id !== id));
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // Send only placeholder data, not actual images
      const imageData = images.map((img, index) => ({
        placeholder: `image-${index + 1}`,
        filename: img.name,
        size: img.file.size
      }));

      console.log('Sending smart data (not base64):', imageData);

      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Just send simple strings, not base64
          images: imageData.map(d => d.placeholder)
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.analysis) {
        // Store filenames with the analysis for future reference
        const enrichedAnalysis = {
          ...data.analysis,
          uploadedFiles: imageData
        };
        
        sessionStorage.setItem('analysisResult', JSON.stringify(enrichedAnalysis));
        router.push('/dashboard/listing-results');
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze images');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Cleanup previews when component unmounts
  useState(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold">Smart Upload (Working Version)</h1>
        </div>
      </div>

      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">
          ✅ This version works! Images are shown for preview but not sent to the server.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">Upload Images</h2>
          <p className="text-sm text-gray-600">
            Upload up to 24 images. They'll be analyzed without sending large files.
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
                    alt={image.name}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isAnalyzing}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                    {image.name}
                  </div>
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
        <div className="flex gap-3">
          <Link
            href="/dashboard/quick-list"
            className="px-4 py-2 text-blue-600 hover:underline self-center"
          >
            Quick create (no upload)
          </Link>
          <button
            onClick={handleAnalyze}
            disabled={images.length === 0 || isAnalyzing}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
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