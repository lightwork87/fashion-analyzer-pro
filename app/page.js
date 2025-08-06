'use client';

import { useState, useCallback } from 'react';
import { compressMultipleImages } from './utils/imageCompression';

export default function Home() {
  const [images, setImages] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [compressionProgress, setCompressionProgress] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Limit to 24 images
    if (files.length > 24) {
      setError('Maximum 24 images allowed at once');
      return;
    }
    
    setError(null);
    setCompressionProgress({ current: 0, total: files.length });
    
    try {
      // Compress all images
      const compressedFiles = await compressMultipleImages(files, (current, total, fileName) => {
        setCompressionProgress({ current, total, fileName });
      });
      
      // Create preview URLs
      const imageData = compressedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        originalSize: files[files.findIndex(f => f.name === file.name)].size,
        compressedSize: file.size
      }));
      
      setImages(imageData);
      setCompressionProgress(null);
    } catch (err) {
      setError('Failed to process images: ' + err.message);
      setCompressionProgress(null);
    }
  }, []);

  const analyzeImages = async () => {
    if (images.length === 0) {
      setError('Please select images first');
      return;
    }
    
    setAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      // Add all compressed images to FormData
      images.forEach((img, index) => {
        formData.append(`image${index}`, img.file);
      });
      
      console.log(`Sending ${images.length} images for analysis...`);
      
      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Analysis failed');
      }
      
      const data = await response.json();
      setResults(data);
      
    } catch (err) {
      setError('Analysis failed: ' + err.message);
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setImages([]);
    setResults(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Fashion Analyzer Pro</h1>
          <p className="text-gray-600">AI-powered fashion analysis for eBay reselling</p>
        </div>
        
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Fashion Images</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
              disabled={compressionProgress !== null}
            />
            <label
              htmlFor="file-input"
              className="cursor-pointer inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {compressionProgress ? 'Compressing...' : 'Select Images (Max 24)'}
            </label>
            
            <p className="mt-4 text-gray-600">
              Upload up to 24 fashion items at once • Any size images will be automatically compressed
            </p>
          </div>
          
          {/* Compression Progress */}
          {compressionProgress && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Compressing image {compressionProgress.current} of {compressionProgress.total}
                {compressionProgress.fileName && `: ${compressionProgress.fileName}`}
              </p>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(compressionProgress.current / compressionProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>
        
        {/* Image Preview Grid */}
        {images.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Selected Images ({images.length})
              </h2>
              <button
                onClick={clearAll}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img.preview}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <button
                      onClick={() => removeImage(index)}
                      className="text-white bg-red-600 p-2 rounded-full hover:bg-red-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {(img.originalSize / 1024).toFixed(0)}KB → {(img.compressedSize / 1024).toFixed(0)}KB
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={analyzeImages}
              disabled={analyzing || images.length === 0}
              className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold transition-colors"
            >
              {analyzing ? `Analyzing ${images.length} images...` : `Analyze ${images.length} Images`}
            </button>
          </div>
        )}
        
        {/* Results Section */}
        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Analysis Results - {results.summary.totalItems} Items Found
            </h2>
            
            {results.items.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {results.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                      <div className="mb-3">
                        <h3 className="font-semibold text-lg">{item.brand.name} {item.itemType}</h3>
                        <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Condition:</span>
                          <span className="font-medium">{item.condition.score}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Size:</span>
                          <span className="font-medium">{item.size}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Color:</span>
                          <span className="font-medium">{item.color}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price Range:</span>
                          <span className="font-medium text-green-600">£{item.estimatedPrice.min}-{item.estimatedPrice.max}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                        <p className="font-semibold mb-1">eBay Title:</p>
                        <p className="break-all">{item.ebayTitle}</p>
                      </div>
                      
                      {item.keyFeatures && item.keyFeatures.length > 0 && (
                        <div className="mt-3 text-xs">
                          <p className="font-semibold mb-1">Key Features:</p>
                          <p className="text-gray-600">{item.keyFeatures.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold text-blue-600">{results.summary.totalItems}</p>
                      <p className="text-sm text-gray-600 mt-1">Items Detected</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-green-600">£{results.summary.totalValue}</p>
                      <p className="text-sm text-gray-600 mt-1">Total Value</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-purple-600">£{results.summary.avgItemValue}</p>
                      <p className="text-sm text-gray-600 mt-1">Average Value</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No items were detected in the uploaded images. Please try with clearer fashion item photos.
              </div>
            )}
            
            {results.errors && results.errors.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-yellow-800 mb-2">
                  {results.errors.length} image(s) could not be processed:
                </p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {results.errors.map((err, idx) => (
                    <li key={idx}>Image {err.imageIndex + 1}: {err.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}