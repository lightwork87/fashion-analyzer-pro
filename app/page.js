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
      
      // Always try to parse as JSON
      const data = await response.json();
      
      if (!response.ok) {
        // API returned an error
        throw new Error(data.details || data.error || `Server error: ${response.status}`);
      }
      
      // Check if the response indicates an error
      if (data.error) {
        throw new Error(data.details || data.error);
      }
      
      setResults(data);
      
    } catch (err) {
      // Handle JSON parsing errors
      if (err instanceof SyntaxError) {
        setError('Server returned invalid response. Please try again.');
      } else {
        setError('Analysis failed: ' + err.message);
      }
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
              disabled={compressionProgress !== null || analyzing}
            />
            <label
              htmlFor="file-input"
              className={`cursor-pointer inline-flex items-center px-6 py-3 rounded-lg transition-colors ${
                compressionProgress || analyzing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {compressionProgress ? 'Compressing...' : analyzing ? 'Analyzing...' : 'Select Images (Max 24)'}
            </label>
            
            <p className="mt-4 text-gray-600">
              Upload multiple photos of the same item • All images will be analyzed as one listing
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
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Image Preview Grid */}
        {images.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Selected Images ({images.length} photos of one item)
              </h2>
              <button
                onClick={clearAll}
                className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
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
                  <div className="mt-1 text-xs text-gray-600 text-center">
                    {(img.originalSize / 1024).toFixed(0)}KB → {(img.compressedSize / 1024).toFixed(0)}KB
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={analyzeImages}
              disabled={analyzing || images.length === 0}
              className={`mt-6 w-full py-3 rounded-lg font-semibold transition-colors ${
                analyzing || images.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {analyzing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing {images.length} images as one item...
                </span>
              ) : (
                `Analyze ${images.length} Images as One Item`
              )}
            </button>
          </div>
        )}
        
        {/* Results Section */}
        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Analysis Results
            </h2>
            
            {results.items && results.items.length > 0 ? (
              <>
                <div className="border rounded-lg p-6 mb-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-2xl">{results.items[0].brand.name} {results.items[0].itemType}</h3>
                    <p className="text-sm text-gray-600 mt-1">SKU: {results.items[0].sku}</p>
                    <p className="text-xs text-gray-500 mt-1">Analyzed from {results.items[0].imageCount} photos</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div className="border-l-4 border-blue-500 pl-3">
                      <p className="text-sm text-gray-600">Condition</p>
                      <p className="font-semibold">{results.items[0].condition.score}/10</p>
                      <p className="text-xs text-gray-600">{results.items[0].condition.description}</p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-3">
                      <p className="text-sm text-gray-600">Size</p>
                      <p className="font-semibold">{results.items[0].size}</p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-3">
                      <p className="text-sm text-gray-600">Color</p>
                      <p className="font-semibold">{results.items[0].color}</p>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-3">
                      <p className="text-sm text-gray-600">Material</p>
                      <p className="font-semibold">{results.items[0].material}</p>
                    </div>
                    <div className="border-l-4 border-red-500 pl-3">
                      <p className="text-sm text-gray-600">Gender</p>
                      <p className="font-semibold">{results.items[0].gender}</p>
                    </div>
                    <div className="border-l-4 border-indigo-500 pl-3">
                      <p className="text-sm text-gray-600">Price Range</p>
                      <p className="font-semibold text-green-600">£{results.items[0].estimatedPrice.min}-{results.items[0].estimatedPrice.max}</p>
                    </div>
                  </div>
                  
                  {/* Measurements if available */}
                  {results.items[0].measurements && Object.keys(results.items[0].measurements).length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="font-semibold text-sm mb-2">Measurements:</p>
                      <div className="flex gap-4">
                        {results.items[0].measurements.chest && (
                          <span className="text-sm">Chest: {results.items[0].measurements.chest}</span>
                        )}
                        {results.items[0].measurements.length && (
                          <span className="text-sm">Length: {results.items[0].measurements.length}</span>
                        )}
                        {results.items[0].measurements.shoulders && (
                          <span className="text-sm">Shoulders: {results.items[0].measurements.shoulders}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Condition flaws if any */}
                  {results.items[0].condition.flaws && results.items[0].condition.flaws.length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded">
                      <p className="font-semibold text-sm mb-2">Condition Notes:</p>
                      <ul className="list-disc list-inside text-sm text-yellow-800">
                        {results.items[0].condition.flaws.map((flaw, idx) => (
                          <li key={idx}>{flaw}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mb-4 p-4 bg-blue-50 rounded">
                    <p className="font-semibold text-sm mb-2">eBay Title ({results.items[0].ebayTitle.length}/80 chars):</p>
                    <p className="text-sm font-mono break-all">{results.items[0].ebayTitle}</p>
                  </div>
                  
                  {results.items[0].keyFeatures && results.items[0].keyFeatures.length > 0 && (
                    <div className="mb-4">
                      <p className="font-semibold text-sm mb-2">Key Features:</p>
                      <div className="flex flex-wrap gap-2">
                        {results.items[0].keyFeatures.map((feature, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 text-sm rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 p-4 bg-gray-100 rounded">
                    <p className="font-semibold text-sm mb-2">Full Description:</p>
                    <p className="text-sm whitespace-pre-line">{results.items[0].description}</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">£{results.summary.avgItemValue}</p>
                    <p className="text-sm text-gray-600 mt-1">Estimated Value</p>
                    <p className="text-xs text-gray-500 mt-2">Based on {results.summary.totalImages} analyzed images</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No items were detected in the uploaded images. Please try with clearer fashion item photos.
              </div>
            )}
            
            {results.errors && results.errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-800 mb-2">
                  Analysis failed:
                </p>
                <ul className="text-xs text-red-700 space-y-1">
                  {results.errors.map((err, idx) => (
                    <li key={idx}>{err.error}</li>
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