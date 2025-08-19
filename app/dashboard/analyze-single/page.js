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
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
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
      useCredit(); // Deduct credit after successful analysis
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
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
                  <img src={preview} alt="Preview" className="max-w-full h-64 object-contain mx-auto rounded" />
                  <button
                    onClick={() => {
                      setImage(null);
                      setPreview(null);
                      setResults(null);
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-500">
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
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
          </div>

          {/* Results Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Analysis Results</h2>
            
            {results ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
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
                      onClick={() => copyToClipboard(results.TITLE || results.title || '')}
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
                      className="flex-1 p-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      onClick={() => copyToClipboard(results.DESCRIPTION || results.description || '')}
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
                  <input
                    type="text"
                    value={`£${results.SUGGESTED_PRICE_GBP || results.suggestedPrice || '0.00'}`}
                    readOnly
                    className="w-full p-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
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
                  <input
                    type="text"
                    value={results.CONDITION || results.condition || 'Good'}
                    readOnly
                    className="w-full p-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
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
                {results.visionData?.colors && (
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

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">
                    List on eBay
                  </button>
                  <button className="flex-1 py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}