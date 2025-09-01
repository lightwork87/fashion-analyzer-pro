'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Camera, Upload, Zap, CheckCircle, AlertCircle } from 'lucide-react';

function AnalyzeSinglePage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isSignedIn, isLoaded, router]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setError('');
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`image-${index}`, file);
      });

      const response = await fetch('/api/analyze-single', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to analyze images. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <Camera className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analyze Single Item</h1>
            <p className="text-gray-600">Upload photos of your fashion item for instant AI analysis</p>
          </div>

          {/* File Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Images
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Click to upload images
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF up to 10MB each. Multiple images recommended.
                </p>
              </label>
            </div>
            
            {files.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Selected Files ({files.length}):
                </p>
                <ul className="space-y-1">
                  {files.map((file, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Analyze Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleAnalyze}
              disabled={analyzing || files.length === 0}
              className={`px-8 py-3 rounded-lg font-semibold flex items-center mx-auto transition-colors ${
                analyzing || files.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Zap className="h-5 w-5 mr-2" />
              {analyzing ? 'Analyzing...' : 'Analyze Item'}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Item Details</h4>
                  <ul className="space-y-1 text-sm">
                    <li><span className="font-medium">Brand:</span> {result.brand || 'Unknown'}</li>
                    <li><span className="font-medium">Category:</span> {result.category || 'Unknown'}</li>
                    <li><span className="font-medium">Condition:</span> {result.condition || 'Unknown'}</li>
                    <li><span className="font-medium">Size:</span> {result.size || 'Unknown'}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Pricing</h4>
                  <ul className="space-y-1 text-sm">
                    <li><span className="font-medium">Estimated Value:</span> ${result.estimatedPrice || 'N/A'}</li>
                    <li><span className="font-medium">Suggested Price:</span> ${result.suggestedPrice || 'N/A'}</li>
                    <li><span className="font-medium">Market Range:</span> ${result.priceRange?.min || 'N/A'} - ${result.priceRange?.max || 'N/A'}</li>
                  </ul>
                </div>
              </div>
              
              {result.description && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">AI Description</h4>
                  <p className="text-sm text-gray-600">{result.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

