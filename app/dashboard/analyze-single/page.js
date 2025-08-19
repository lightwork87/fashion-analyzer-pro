'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCredits } from '../../contexts/CreditsContext';

export default function AnalyzeSingle() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const { credits, useCredit } = useCredits();
  const router = useRouter();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image too large. Maximum size is 10MB.');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError('Please select an image');
      return;
    }

    if (credits < 1) {
      setError('Insufficient credits. Please purchase more credits.');
      router.push('/dashboard/pricing');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResults(data.analysis);
      
      // Only deduct credit if not in test mode
      if (!data.analysis.testMode) {
        useCredit();
      }

      // Save to history
      const historyItem = {
        title: data.analysis.title || data.analysis.TITLE,
        description: data.analysis.description || data.analysis.DESCRIPTION,
        price: data.analysis.SUGGESTED_PRICE_GBP || data.analysis.suggestedPrice,
        category: data.analysis.category || data.analysis.CATEGORY,
        condition: data.analysis.condition || data.analysis.CONDITION,
        tags: data.analysis.tags || data.analysis.TAGS || [],
        brand: data.analysis.brand || data.analysis.BRAND,
        timestamp: new Date().toISOString()
      };

      const existingHistory = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
      existingHistory.unshift(historyItem); // Add to beginning
      if (existingHistory.length > 50) existingHistory.pop(); // Keep max 50 items
      localStorage.setItem('analysisHistory', JSON.stringify(existingHistory));

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Show a temporary success message
    const button = event.target;
    const originalText = button.innerText;
    button.innerText = '✅';
    setTimeout(() => {
      button.innerText = originalText;
    }, 1000);
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">Single Item Analysis</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Upload Image</h2>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              {preview ? (
                <div className="space-y-4">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="max-w-full h-64 object-contain mx-auto rounded" 
                  />
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => {
                        setImage(null);
                        setPreview(null);
                        setResults(null);
                        setError(null);
                      }}
                      className="text-red-500 hover:text-red-600 font-medium"
                    >
                      Remove Image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-500 font-medium">
                        Upload a file
                      </span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded">
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!image || loading || credits < 1}
              className={`w-full mt-4 py-3 px-4 rounded-lg font-medium transition-colors ${
                !image || loading || credits < 1
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                `Analyze (1 Credit)`
              )}
            </button>

            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              You have {credits} credits remaining
            </p>
          </div>

          {/* Results Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Analysis Results</h2>
            
            {results ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {results.testMode && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded text-sm">
                    ⚠️ Test Mode: Add API keys for real AI analysis
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={results.TITLE || results.title || ''}
                      readOnly
                      className="flex-1 p-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      onClick={(e) => copyToClipboard(results.TITLE || results.title || '')}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      📋
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      value={results.DESCRIPTION || results.description || ''}
                      readOnly
                      rows={4}
                      className="flex-1 p-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white resize-none"
                    />
                    <button
                      onClick={(e) => copyToClipboard(results.DESCRIPTION || results.description || '')}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 h-fit"
                    >
                      📋
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Suggested Price (GBP)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`£${results.SUGGESTED_PRICE_GBP || results.suggestedPrice || '0.00'}`}
                      readOnly
                      className="flex-1 p-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      onClick={(e) => copyToClipboard(results.SUGGESTED_PRICE_GBP || results.suggestedPrice || '0.00')}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      📋
                    </button>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={results.CATEGORY || results.category || ''}
                    readOnly
                    className="w-full p-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Condition
                  </label>
                  <select
                    value={results.CONDITION || results.condition || 'Good'}
                    className="w-full p-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    readOnly
                  >
                    <option>New</option>
                    <option>Like New</option>
                    <option>Good</option>
                    <option>Fair</option>
                  </select>
                </div>

                {/* Brand */}
                {(results.BRAND || results.brand) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={results.BRAND || results.brand}
                      readOnly
                      className="w-full p-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}

                {/* Size */}
                {(results.SIZE || results.size) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Size
                    </label>
                    <input
                      type="text"
                      value={results.SIZE || results.size}
                      readOnly
                      className="w-full p-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(results.TAGS || results.tags || []).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Colors Detected */}
                {results.visionData?.colors && results.visionData.colors.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Detected Colors
                    </label>
                    <div className="flex gap-2">
                      {results.visionData.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-10 h-10 rounded border dark:border-gray-600"
                          style={{ backgroundColor: `rgb(${color.rgb})` }}
                          title={`RGB(${color.rgb})`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Style Notes */}
                {(results.STYLE_NOTES || results.styleNotes) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Style Notes
                    </label>
                    <p className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm dark:text-gray-300">
                      {results.STYLE_NOTES || results.styleNotes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pt-4 border-t dark:border-gray-700">
                  <button 
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    disabled={results.testMode}
                  >
                    List on eBay
                  </button>
                  <button 
                    className="flex-1 py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                    disabled={results.testMode}
                  >
                    List on Vinted
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Upload and analyze an image to see results</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  AI will detect brand, style, condition and suggest pricing
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}