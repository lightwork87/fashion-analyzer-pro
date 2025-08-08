'use client';

import { useState, useCallback, useEffect } from 'react';
import { compressMultipleImages } from './utils/imageCompression';
import { calculateCreditsNeeded } from './lib/stripe';

export default function Home() {
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

  // Prevent hydration errors
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
    
    // Check if user has enough credits
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
      
      if (data.error) {
        throw new Error(data.details || data.error);
      }
      
      setResults(data);
      
      // Update credit info from response
      if (data.creditInfo) {
        setCreditInfo(data.creditInfo);
      }
      
      // Pre-populate editable fields
      if (data.items && data.items.length > 0) {
        setEditedTitle(data.items[0].ebayTitle);
        setEditedPrice({
          min: data.items[0].estimatedPrice.min,
          max: data.items[0].estimatedPrice.max
        });
        setEditedDescription(data.items[0].description);
      }
      
    } catch (err) {
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

  // Calculate credits needed for current selection
  const creditsNeeded = images.length > 0 ? calculateCreditsNeeded(images.length) : 0;

  // Don't render interactive elements until mounted
  if (!mounted) {
    return (
      <main className="min-h-screen bg-gray-100">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Fashion Analyzer Pro</h1>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">AI Powered</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Loading...</div>
        </div>
      </main>
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
              <div className="text-sm">
                <span className="text-gray-600">Credits:</span>
                <span className={`font-medium ml-2 ${
                  creditInfo.creditsRemaining < 20 ? 'text-orange-600' : 'text-gray-900'
                }`}>
                  {creditInfo.creditsRemaining} / {creditInfo.totalCredits}
                </span>
              </div>
              <div className="flex gap-4">
                <button className="text-gray-600 hover:text-gray-900">Dashboard</button>
                <a href="/pricing" className="text-blue-600 hover:text-blue-700 font-medium">Upgrade</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Main content */}
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">AI-Powered Fashion Analysis</h2>
          <p className="text-xl text-gray-600 mb-8">
            Upload photos to analyze fashion items with AI for eBay reselling
          </p>
          
          <div className="flex gap-4 justify-center">
            <a 
              href="/pricing" 
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View Pricing Plans
            </a>
            <button 
              onClick={() => alert('Upload feature coming soon!')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Start Analysis
            </button>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            You have {creditInfo.creditsRemaining} free credits remaining
          </div>
        </div>
      </div>
    </main>
  );
}