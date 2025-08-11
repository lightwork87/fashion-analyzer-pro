'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { compressMultipleImages } from '../utils/imageCompression';
import CreditDisplay from '../components/CreditDisplay';
import { calculateCreditsNeeded } from '../lib/stripe';
import { useUserData } from '../hooks/useUserData';

export default function Dashboard() {
  const router = useRouter();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { creditInfo, refreshCredits } = useUserData();
  const [mounted, setMounted] = useState(false);
  const [images, setImages] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [compressionProgress, setCompressionProgress] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedPrice, setEditedPrice] = useState({ min: '', max: '' });
  const [editedDescription, setEditedDescription] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (clerkLoaded && !clerkUser) {
      router.push('/sign-in');
    }
  }, [clerkUser, clerkLoaded, router]);

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    if (files.length > 24) {
      setError('Maximum 24 images allowed at once');
      return;
    }
    
    const creditsNeeded = 1; // Always 1 credit per listing
    if (creditsNeeded > creditInfo.creditsRemaining) {
      setError(`This analysis requires ${creditsNeeded} credit. You have ${creditInfo.creditsRemaining} credits remaining.`);
      return;
    }
    
    setError(null);
    setCompressionProgress({ current: 0, total: files.length });
    
    try {
      const compressedFiles = await compressMultipleImages(files, (current, total, fileName) => {
        setCompressionProgress({ current, total, fileName });
      });
      
      const imageData = compressedFiles.map((file, index) => ({
        file,
        preview: URL.createObjectURL(file),
        originalSize: files[index].size,
        compressedSize: file.size
      }));
      
      setImages(imageData);
      setCompressionProgress(null);
    } catch (err) {
      setError('Failed to process images: ' + err.message);
      setCompressionProgress(null);
    }
  }, [creditInfo]);

  const analyzeImages = async () => {
    if (images.length === 0) {
      setError('Please select images first');
      return;
    }
    
    const creditsNeeded = 1; // Always 1 credit per listing
    if (creditsNeeded > creditInfo.creditsRemaining) {
      setError(`Insufficient credits. You need ${creditsNeeded} credit but have ${creditInfo.creditsRemaining}.`);
      return;
    }
    
    setAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      images.forEach((img, index) => {
        formData.append(`image${index}`, img.file);
      });
      
      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.type === 'INSUFFICIENT_CREDITS') {
          setError(`Insufficient credits. ${data.details}`);
          await refreshCredits(); // Refresh credit display
          return;
        }
        throw new Error(data.details || data.error || `Server error: ${response.status}`);
      }
      
      setResults(data);
      
      // Refresh credits after successful analysis
      await refreshCredits();
      
      if (data.items && data.items.length > 0) {
        setEditedTitle(data.items[0].ebayTitle);
        setEditedPrice({
          min: data.items[0].estimatedPrice.min,
          max: data.items[0].estimatedPrice.max
        });
        setEditedDescription(data.items[0].description);
      }
      
    } catch (err) {
      setError('Analysis failed: ' + err.message);
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
    setEditedTitle('');
    setEditedPrice({ min: '', max: '' });
    setEditedDescription('');
  };

  const generateItemSpecifics = () => {
    if (!results || !results.items || results.items.length === 0) return {};
    
    const item = results.items[0];
    return {
      'Brand': item.brand.name !== 'Unknown' ? item.brand.name : '',
      'Size': item.size !== 'Not Visible' ? item.size : '',
      'Color': item.color || '',
      'Material': item.material !== 'Not Specified' ? item.material : '',
      'Department': item.gender || '',
      'Type': item.itemType || '',
      'Condition': item.condition.description || '',
      'Style': item.keyFeatures?.find(f => f.toLowerCase().includes('style'))?.replace(/style:?\s*/i, '') || '',
      'Pattern': item.keyFeatures?.find(f => f.toLowerCase().includes('pattern'))?.replace(/pattern:?\s*/i, '') || '',
      'Features': item.keyFeatures?.filter(f => !f.toLowerCase().includes('style') && !f.toLowerCase().includes('pattern')).join(', ') || '',
      'Season': item.keyFeatures?.find(f => ['summer', 'winter', 'spring', 'fall', 'autumn'].some(s => f.toLowerCase().includes(s))) || '',
      'Occasion': item.keyFeatures?.find(f => ['casual', 'formal', 'business', 'party', 'wedding'].some(o => f.toLowerCase().includes(o))) || '',
      'Sleeve Length': item.keyFeatures?.find(f => f.toLowerCase().includes('sleeve')) || '',
      'Fit': item.keyFeatures?.find(f => ['slim', 'regular', 'relaxed', 'oversized'].some(fit => f.toLowerCase().includes(fit))) || '',
    };
  };

  if (!mounted || !clerkLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!clerkUser) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Fashion Analyzer Pro</h1>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">AI Powered</span>
            </div>
            <div className="flex items-center gap-6">
              <CreditDisplay creditInfo={creditInfo} compact={true} />
              <div className="flex gap-4">
                <button 
                  onClick={() => router.push('/')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Home
                </button>
                <button 
                  onClick={() => router.push('/pricing')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Credit Warning */}
        {creditInfo.creditsRemaining < 20 && creditInfo.creditsRemaining > 0 && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-orange-800">
              ⚠️ You have {creditInfo.creditsRemaining} credits remaining. 
              <a href="/pricing" className="ml-2 underline font-medium">Get more credits</a>
            </p>
          </div>
        )}

        {creditInfo.creditsRemaining === 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">
              ❌ You're out of credits! 
              <a href="/pricing" className="ml-2 underline">Upgrade now to continue analyzing</a>
            </p>
          </div>
        )}

        {/* Upload Section */}
        {!results && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Add Photos
            </h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
                disabled={compressionProgress !== null || analyzing || creditInfo.creditsRemaining === 0}
              />
              <label
                htmlFor="file-input"
                className={`cursor-pointer inline-flex items-center px-8 py-3 rounded-md transition-all ${
                  compressionProgress || analyzing || creditInfo.creditsRemaining === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                {compressionProgress ? 'Processing...' : analyzing ? 'Analyzing...' : creditInfo.creditsRemaining === 0 ? 'No Credits' : 'Select Photos'}
              </label>
              
              <p className="mt-4 text-sm text-gray-600">
                Drop photos here or click to browse • Max 24 photos per listing
              </p>
              <p className="mt-1 text-xs text-gray-500">
                All photos will be analyzed as one item • 1 credit per listing
              </p>
            </div>
            
            {compressionProgress && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Processing photo {compressionProgress.current} of {compressionProgress.total}
                  {compressionProgress.fileName && ` - ${compressionProgress.fileName}`}
                </p>
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(compressionProgress.current / compressionProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Image Preview */}
        {images.length > 0 && !results && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {images.length} Photos Selected
                <span className="text-sm text-gray-500 ml-2">
                  (1 credit required)
                </span>
              </h3>
              <button
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove All
              </button>
            </div>
            
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img.preview}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded border hover:border-blue-500 transition-colors"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">
                      Main
                    </span>
                  )}
                  <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                    {(img.compressedSize / 1024).toFixed(0)}KB
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Total size: {(images.reduce((sum, img) => sum + img.compressedSize, 0) / 1024 / 1024).toFixed(1)}MB
              </div>
              <button
                onClick={analyzeImages}
                disabled={analyzing || creditInfo.creditsRemaining < 1}
                className={`px-6 py-2.5 rounded-md font-medium transition-all ${
                  analyzing || creditInfo.creditsRemaining < 1
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow'
                }`}
              >
                {analyzing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing with AI...
                  </span>
                ) : creditInfo.creditsRemaining < 1 ? (
                  'Insufficient Credits'
                ) : (
                  `Analyze with AI (1 credit)`
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Results Section */}
        {results && results.items && results.items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Photos */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-6">
                <h3 className="font-semibold mb-3 text-sm text-gray-700">Photos ({results.items[0].imageCount})</h3>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, index) => (
                    <img
                      key={index}
                      src={img.preview}
                      alt={`Photo ${index + 1}`}
                      className={`w-full h-20 object-cover rounded border ${index === 0 ? 'border-blue-500 border-2' : 'border-gray-300'}`}
                    />
                  ))}
                </div>
                
                {/* Credit Usage Summary */}
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700 font-medium">Credits Used: 1</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Remaining: {creditInfo.creditsRemaining} / {creditInfo.totalCredits}
                  </p>
                </div>
                
                <button
                  onClick={clearAll}
                  className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:border-gray-400 transition-colors"
                >
                  Start New Listing
                </button>
              </div>
            </div>
            
            {/* Right Column - Listing Details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border">
                {/* Tabs */}
                <div className="border-b">
                  <div className="flex">
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'details'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Listing Details
                    </button>
                    <button
                      onClick={() => setActiveTab('specifics')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'specifics'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Item Specifics
                    </button>
                    <button
                      onClick={() => setActiveTab('pricing')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'pricing'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Pricing & SKU
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Listing Details Tab */}
                  {activeTab === 'details' && (
                    <div className="space-y-6">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title <span className="text-red-500">*</span>
                          <span className="float-right text-xs text-gray-500">{editedTitle.length}/80</span>
                        </label>
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value.slice(0, 80))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">AI optimized for eBay search</p>
                      </div>
                      
                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={results.items[0].ebayCategory}
                            readOnly
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                          />
                          <button className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
                            Change
                          </button>
                        </div>
                      </div>
                      
                      {/* Condition */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Condition <span className="text-red-500">*</span>
                        </label>
                        <select 
                          defaultValue={results.items[0].condition.score >= 10 ? 'new-with-tags' : 
                                       results.items[0].condition.score === 9 ? 'new-without-tags' :
                                       results.items[0].condition.score === 8 ? 'new-with-defects' : 'used'}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="new-with-tags">New with tags</option>
                          <option value="new-without-tags">New without tags</option>
                          <option value="new-with-defects">New with defects</option>
                          <option value="used">Pre-owned</option>
                        </select>
                      </div>
                      
                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          rows={8}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">AI generated from image analysis</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Item Specifics Tab */}
                  {activeTab === 'specifics' && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Item specifics help buyers find your item. We've auto-filled these based on AI analysis.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(generateItemSpecifics()).map(([key, value]) => (
                          <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {key}
                              {['Brand', 'Size', 'Color', 'Type'].includes(key) && <span className="text-red-500"> *</span>}
                            </label>
                            <input
                              type="text"
                              defaultValue={value}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={`Enter ${key.toLowerCase()}`}
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-sm text-blue-800">
                            <p className="font-medium">AI Confidence: {Math.round(results.items[0].brand.confidence * 100)}%</p>
                            <p className="mt-1">Our AI has analyzed your photos and extracted these details automatically. Review and adjust as needed.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Pricing Tab */}
                  {activeTab === 'pricing' && (
                    <div className="space-y-6">
                      {/* Pricing */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          Pricing Strategy
                        </label>
                        
                        <div className="space-y-4">
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <input type="radio" name="pricing" id="fixed" className="text-blue-600" defaultChecked />
                                <label htmlFor="fixed" className="font-medium">Fixed Price</label>
                              </div>
                              <span className="text-sm text-gray-500">Recommended</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                                <div className="flex items-center">
                                  <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">£</span>
                                  <input
                                    type="number"
                                    value={editedPrice.min}
                                    onChange={(e) => setEditedPrice({...editedPrice, min: e.target.value})}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                                <div className="flex items-center">
                                  <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">£</span>
                                  <input
                                    type="number"
                                    value={editedPrice.max}
                                    onChange={(e) => setEditedPrice({...editedPrice, max: e.target.value})}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 border rounded-lg opacity-60">
                            <div className="flex items-center gap-2 mb-3">
                              <input type="radio" name="pricing" id="auction" className="text-blue-600" />
                              <label htmlFor="auction" className="font-medium">Auction</label>
                            </div>
                          </div>
                        </div>
                        
                        {/* AI Price Analysis */}
                        <div className="mt-6 p-4 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-2">AI Price Analysis</h4>
                          <div className="text-sm text-green-800 space-y-1">
                            <p>• Similar {results.items[0].brand.name} items sell for £{editedPrice.min}-£{editedPrice.max}</p>
                            <p>• Condition score ({results.items[0].condition.score}/10) suggests pricing at the {results.items[0].condition.score >= 8 ? 'higher' : 'lower'} end</p>
                            <p>• {results.items[0].brand.confidence > 0.8 ? 'High' : 'Medium'} brand confidence supports this pricing</p>
                            {results.items[0].measurements?.hasRuler && (
                              <p className="text-green-900 font-medium">• 35% price boost applied for measured item</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* SKU */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SKU (Stock Keeping Unit)
                        </label>
                        <input
                          type="text"
                          value={results.items[0].sku}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                        <p className="mt-1 text-xs text-gray-500">Auto-generated for inventory tracking</p>
                      </div>
                      
                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          defaultValue="1"
                          min="1"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="mt-8 pt-6 border-t flex justify-between items-center">
                    <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                      Save as Draft
                    </button>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
                        Preview Listing
                      </button>
                      <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm hover:shadow">
                        List on eBay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">£{results.summary.avgItemValue}</p>
                  <p className="text-sm text-gray-600 mt-1">Est. Value</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{results.items[0].condition.score}/10</p>
                  <p className="text-sm text-gray-600 mt-1">Condition</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{Math.round(results.items[0].brand.confidence * 100)}%</p>
                  <p className="text-sm text-gray-600 mt-1">AI Confidence</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Errors */}
        {results && results.errors && results.errors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-800 mb-2">Analysis Error</p>
            <p className="text-sm text-red-700">{results.errors[0].error}</p>
          </div>
        )}
      </div>
    </main>
  );
}