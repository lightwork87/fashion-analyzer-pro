'use client';

import { useState, useCallback } from 'react';
import { compressMultipleImages } from '../utils/imageCompression';

export default function BatchAnalysisWorkspace() {
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
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Fashion Analyzer Pro - Batch Processing</h1>
      
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Images</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
            className="cursor-pointer inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {compressionProgress ? 'Compressing...' : 'Select Images (Max 24)'}
          </label>
          
          <p className="mt-4 text-gray-600">
            Drop up to 24 images here or click to browse
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
              className="text-red-600 hover:text-red-700 text-sm"
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
                    className="text-white bg-red-600 p-2 rounded-full hover:bg-red-700"
                  >
                    ✕
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
            className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-lg">{item.brand.name} {item.itemType}</h3>
                  <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Condition:</span>
                    <span className="font-medium">{item.condition.score}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="font-medium">{item.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price Range:</span>
                    <span className="font-medium">£{item.estimatedPrice.min}-{item.estimatedPrice.max}</span>
                  </div>
                </div>
                
                <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                  <p className="font-semibold mb-1">eBay Title:</p>
                  <p className="break-all">{item.ebayTitle}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{results.summary.totalItems}</p>
                <p className="text-sm text-gray-600">Items Detected</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">£{results.summary.totalValue}</p>
                <p className="text-sm text-gray-600">Total Value</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">£{results.summary.avgItemValue}</p>
                <p className="text-sm text-gray-600">Avg Value</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}