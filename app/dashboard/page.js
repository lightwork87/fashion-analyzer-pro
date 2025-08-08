'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { compressMultipleImages } from '../utils/imageCompression';
import CreditDisplay from '../components/CreditDisplay';
import { calculateCreditsNeeded } from '../lib/stripe';

export default function Dashboard() {
  const router = useRouter();
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
  const [creditInfo, setCreditInfo] = useState({
    creditsRemaining: 10,
    totalCredits: 10,
    subscription: 'free'
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    if (files.length > 24) {
      setError('Maximum 24 images allowed at once');
      return;
    }
    
    const creditsNeeded = calculateCreditsNeeded(files.length);
    if (creditsNeeded > creditInfo.creditsRemaining) {
      setError(`This analysis requires ${creditsNeeded} credits. You have ${creditInfo.creditsRemaining} credits remaining.`);
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
    
    const creditsNeeded = calculateCreditsNeeded(images.length);
    if (creditsNeeded > creditInfo.creditsRemaining) {
      setError(`Insufficient credits. You need ${creditsNeeded} credits but have ${creditInfo.creditsRemaining}.`);
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
          if (data.creditsAvailable !== undefined) {
            setCreditInfo(prev => ({
              ...prev,
              creditsRemaining: data.creditsAvailable
            }));
          }
          return;
        }
        throw new Error(data.details || data.error || `Server error: ${response.status}`);
      }
      
      setResults(data);
      
      if (data.creditInfo) {
        setCreditInfo(data.creditInfo);
      }
      
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

  const creditsNeeded = images.length > 0 ? calculateCreditsNeeded(images.length) : 0;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
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
                All photos will be analyzed as one item • 1 credit per photo
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
                  ({creditsNeeded} credits required)
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
                disabled={analyzing || creditInfo.creditsRemaining < creditsNeeded}
                className={`px-6 py-2.5 rounded-md font-medium transition-all ${
                  analyzing || creditInfo.creditsRemaining < creditsNeeded
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
                ) : creditInfo.creditsRemaining < creditsNeeded ? (
                  'Insufficient Credits'
                ) : (
                  `Analyze with AI (${creditsNeeded} credits)`
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Results Section - Collapsed for space, same as before */}
        {results && results.items && results.items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Results content - same as before */}
          </div>
        )}
      </div>
    </main>
  );
}