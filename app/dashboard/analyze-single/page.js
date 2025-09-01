'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

function AnalyzeSinglePage() {
  const { user, isLoaded } = useUser();
  const [credits, setCredits] = useState(0);
  const [images, setImages] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      const data = await response.json();
      setCredits(data.credits || 0);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length + images.length > 8) {
      setError('Maximum 8 images allowed');
      return;
    }

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));

    setImages(prev => [...prev, ...newImages]);
    setError(null);
  };

  const removeImage = (index) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const analyzeImages = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    if (credits < 1) {
      setError('Insufficient credits. Please purchase more credits.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image.file);
      });

      const response = await fetch('/api/analyze-fashion', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResults(data);
      setCredits(prev => prev - 1);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Single Item Analysis</h1>
        <p className="text-gray-600 mt-2">
          Upload photos of your fashion item for AI-powered analysis
        </p>
        <div className="mt-4">
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Credits remaining: {credits}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <h2 className="text-xl font-semibold">Upload Images</h2>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <p className="text-lg font-medium text-gray-600">
                  Click to upload images
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF up to 10MB each (max 8 images)
                </p>
              </label>
            </div>

            {images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Uploaded Images ({images.length}/8)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.preview}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              onClick={analyzeImages}
              disabled={analyzing || images.length === 0 || credits < 1}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg font-medium"
            >
              {analyzing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Analyzing...
                </div>
              ) : (
                `Analyze Item (1 credit)`
              )}
            </button>
          </div>
        </div>

        <div>
          {results && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Item Title</h4>
                  <p className="text-gray-600">{results.title}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Description</h4>
                  <p className="text-gray-600">{results.description}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Condition</h4>
                  <p className="text-gray-600">{results.condition}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Suggested Price</h4>
                  <p className="text-gray-600">£{results.suggestedPrice}</p>
                </div>
                {results.brand && (
                  <div>
                    <h4 className="font-medium text-gray-900">Brand</h4>
                    <p className="text-gray-600">{results.brand}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyzeSinglePage;