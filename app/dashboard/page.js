'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { compressMultipleImages } from '../utils/imageCompression';
import CreditDisplay from '../components/CreditDisplay';
import { useUserData } from '../hooks/useUserData';
import { supabase } from '../lib/supabase';

// eBay category-specific requirements
const EBAY_CATEGORIES = {
  'mens_clothing': {
    required: ['brand', 'size', 'color', 'condition', 'department'],
    optional: ['size_type', 'style', 'material', 'sleeve_length', 'pattern']
  },
  'womens_clothing': {
    required: ['brand', 'size', 'color', 'condition', 'department', 'size_type'],
    optional: ['style', 'material', 'sleeve_length', 'pattern', 'occasion']
  },
  'shoes': {
    required: ['brand', 'size', 'color', 'condition', 'department', 'shoe_type'],
    optional: ['width', 'material', 'style', 'occasion']
  }
};

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
  const [activeTab, setActiveTab] = useState('upload');
  const [drafts, setDrafts] = useState([]);
  const [savingDraft, setSavingDraft] = useState(false);
  
  // Listing form state
  const [listingData, setListingData] = useState({
    // Basic Info
    title: '',
    sku: '',
    category: 'womens_clothing',
    
    // Item Specifics
    brand: '',
    size: '',
    color: '',
    material: '',
    condition: 'pre-owned',
    condition_description: '',
    department: '',
    size_type: '',
    style: '',
    pattern: '',
    sleeve_length: '',
    occasion: '',
    season: 'all_seasons',
    theme: '',
    features: [],
    garment_care: '',
    country_of_manufacture: '',
    is_vintage: false,
    is_handmade: false,
    
    // Pricing
    listing_format: 'fixed_price',
    buy_it_now_price: '',
    starting_bid: '',
    reserve_price: '',
    auction_duration: 7,
    best_offer_enabled: false,
    minimum_offer: '',
    auto_accept_offer: '',
    auto_decline_offer: '',
    
    // Shipping
    shipping_type: 'calculated',
    package_weight_pounds: 1,
    package_weight_ounces: 0,
    package_length: 12,
    package_width: 9,
    package_height: 3,
    handling_time: 1,
    international_shipping: false,
    
    // Returns
    returns_accepted: true,
    return_period: 30,
    return_shipping_paid_by: 'buyer',
    
    // Description
    description: ''
  });

  useEffect(() => {
    setMounted(true);
    loadDrafts();
  }, []);

  useEffect(() => {
    if (clerkLoaded && !clerkUser) {
      router.push('/sign-in');
    }
  }, [clerkUser, clerkLoaded, router]);

  const loadDrafts = async () => {
    if (!clerkUser) return;
    
    try {
      const { data, error } = await supabase
        .from('draft_listings')
        .select('*')
        .eq('user_id', clerkUser.id)
        .limit(10);
        
      if (!error && data) {
        setDrafts(data);
      }
    } catch (err) {
      console.error('Error loading drafts:', err);
    }
  };

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    if (files.length > 24) {
      setError('Maximum 24 images allowed per listing');
      return;
    }
    
    const creditsNeeded = 1;
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
        throw new Error(data.details || data.error || `Server error: ${response.status}`);
      }
      
      setResults(data);
      await refreshCredits();
      
      // Pre-fill form with AI results
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        setListingData(prev => ({
          ...prev,
          title: item.ebayTitle || '',
          sku: item.sku || '',
          brand: item.brand?.name !== 'Unknown' ? item.brand.name : '',
          size: item.size !== 'Not Visible' ? item.size : '',
          color: item.color || '',
          material: item.material !== 'Not Specified' ? item.material : '',
          condition: item.condition?.score >= 9 ? 'new_with_tags' : 
                    item.condition?.score >= 7 ? 'new_without_tags' :
                    item.condition?.score >= 5 ? 'very_good' : 'good',
          condition_description: item.condition?.description || '',
          description: item.description || '',
          buy_it_now_price: item.estimatedPrice?.max || '',
          starting_bid: item.estimatedPrice?.min || '',
          department: item.gender || '',
          style: item.keyFeatures?.find(f => f.toLowerCase().includes('style'))?.replace(/style:?\s*/i, '') || '',
          pattern: item.keyFeatures?.find(f => f.toLowerCase().includes('pattern'))?.replace(/pattern:?\s*/i, '') || '',
          features: item.keyFeatures || []
        }));
      }
      
      setActiveTab('details');
      
    } catch (err) {
      setError('Analysis failed: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const saveDraft = async () => {
    if (!clerkUser) return;
    
    setSavingDraft(true);
    try {
      const { error } = await supabase
        .from('analyses')
        .insert({
          user_id: clerkUser.id,
          ...listingData,
          images_count: images.length,
          is_draft: true,
          is_listed: false,
          metadata: { images: images.map(img => img.preview) }
        });
        
      if (!error) {
        setError(null);
        alert('Draft saved successfully!');
        loadDrafts();
      } else {
        throw error;
      }
    } catch (err) {
      setError('Failed to save draft: ' + err.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const validateListing = () => {
    const category = EBAY_CATEGORIES[listingData.category];
    const missing = [];
    
    if (category) {
      category.required.forEach(field => {
        if (!listingData[field]) {
          missing.push(field.replace('_', ' '));
        }
      });
    }
    
    if (listingData.listing_format === 'fixed_price' && !listingData.buy_it_now_price) {
      missing.push('Buy It Now price');
    }
    
    if (listingData.listing_format === 'auction' && !listingData.starting_bid) {
      missing.push('Starting bid');
    }
    
    return missing;
  };

  const handleInputChange = (field, value) => {
    setListingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!mounted || !clerkLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!clerkUser) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold text-gray-900">Fashion Analyzer Pro</h1>
              <nav className="flex gap-4">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-3 py-1 rounded ${activeTab === 'upload' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                >
                  Upload
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-3 py-1 rounded ${activeTab === 'details' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                  disabled={!results}
                >
                  Listing Details
                </button>
                <button
                  onClick={() => setActiveTab('drafts')}
                  className={`px-3 py-1 rounded ${activeTab === 'drafts' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                >
                  Drafts ({drafts.length})
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <CreditDisplay creditInfo={creditInfo} compact={true} />
              <button 
                onClick={() => router.push('/pricing')}
                className="text-sm bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Get Credits
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Upload Fashion Items</h2>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={analyzing}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer"
              >
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    Up to 24 images per listing • 1 credit per listing
                  </p>
                </div>
              </label>
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">{images.length} images selected</h3>
                  <button
                    onClick={() => setImages([])}
                    className="text-red-600 text-sm hover:text-red-700"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.preview}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={analyzeImages}
                  disabled={analyzing || images.length === 0}
                  className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {analyzing ? 'Analyzing...' : `Analyze Images (1 Credit)`}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Listing Details Tab */}
        {activeTab === 'details' && results && (
          <div className="space-y-6">
            {/* eBay Listing Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Listing Details</h2>
                <div className="flex gap-2">
                  <button
                    onClick={saveDraft}
                    disabled={savingDraft}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {savingDraft ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    onClick={() => {
                      const missing = validateListing();
                      if (missing.length > 0) {
                        alert(`Missing required fields: ${missing.join(', ')}`);
                      } else {
                        alert('Ready to list on eBay!');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    List on eBay
                  </button>
                </div>
              </div>

              {/* Title & Category */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={listingData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    maxLength={80}
                    className="w-full p-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">{listingData.title.length}/80 characters</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={listingData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="womens_clothing">Women's Clothing</option>
                      <option value="mens_clothing">Men's Clothing</option>
                      <option value="shoes">Shoes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      value={listingData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Item Specifics */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Item Specifics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={listingData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Nike, Adidas, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={listingData.size}
                      onChange={(e) => handleInputChange('size', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="M, L, XL, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={listingData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Blue, Red, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={listingData.condition}
                      onChange={(e) => handleInputChange('condition', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="new_with_tags">New with tags</option>
                      <option value="new_without_tags">New without tags</option>
                      <option value="new_with_defects">New with defects</option>
                      <option value="pre-owned">Pre-owned</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={listingData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Select...</option>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Unisex">Unisex</option>
                      <option value="Kids">Kids</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                    <input
                      type="text"
                      value={listingData.material}
                      onChange={(e) => handleInputChange('material', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Cotton, Polyester, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                    <input
                      type="text"
                      value={listingData.style}
                      onChange={(e) => handleInputChange('style', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Casual, Formal, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pattern</label>
                    <input
                      type="text"
                      value={listingData.pattern}
                      onChange={(e) => handleInputChange('pattern', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Solid, Striped, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                    <select
                      value={listingData.season}
                      onChange={(e) => handleInputChange('season', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="all_seasons">All Seasons</option>
                      <option value="spring">Spring</option>
                      <option value="summer">Summer</option>
                      <option value="fall">Fall</option>
                      <option value="winter">Winter</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="vintage"
                      checked={listingData.is_vintage}
                      onChange={(e) => handleInputChange('is_vintage', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="vintage" className="text-sm">Vintage (20+ years old)</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="handmade"
                      checked={listingData.is_handmade}
                      onChange={(e) => handleInputChange('is_handmade', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="handmade" className="text-sm">Handmade</label>
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Pricing & Format</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Listing Format</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="fixed_price"
                        checked={listingData.listing_format === 'fixed_price'}
                        onChange={(e) => handleInputChange('listing_format', e.target.value)}
                        className="mr-2"
                      />
                      Buy It Now
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="auction"
                        checked={listingData.listing_format === 'auction'}
                        onChange={(e) => handleInputChange('listing_format', e.target.value)}
                        className="mr-2"
                      />
                      Auction
                    </label>
                  </div>
                </div>

                {listingData.listing_format === 'fixed_price' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Buy It Now Price <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={listingData.buy_it_now_price}
                          onChange={(e) => handleInputChange('buy_it_now_price', e.target.value)}
                          className="w-full pl-8 p-2 border rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="best_offer"
                        checked={listingData.best_offer_enabled}
                        onChange={(e) => handleInputChange('best_offer_enabled', e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="best_offer" className="text-sm">Accept offers</label>
                    </div>

                    {listingData.best_offer_enabled && (
                      <div className="grid grid-cols-3 gap-4 ml-6">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Auto-accept at</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1 text-gray-500 text-sm">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={listingData.auto_accept_offer}
                              onChange={(e) => handleInputChange('auto_accept_offer', e.target.value)}
                              className="w-full pl-6 p-1 border rounded text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Auto-decline below</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1 text-gray-500 text-sm">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={listingData.auto_decline_offer}
                              onChange={(e) => handleInputChange('auto_decline_offer', e.target.value)}
                              className="w-full pl-6 p-1 border rounded text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Minimum offer</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1 text-gray-500 text-sm">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={listingData.minimum_offer}
                              onChange={(e) => handleInputChange('minimum_offer', e.target.value)}
                              className="w-full pl-6 p-1 border rounded text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {listingData.listing_format === 'auction' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Starting Bid <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={listingData.starting_bid}
                          onChange={(e) => handleInputChange('starting_bid', e.target.value)}
                          className="w-full pl-8 p-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <select
                        value={listingData.auction_duration}
                        onChange={(e) => handleInputChange('auction_duration', e.target.value)}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value={3}>3 days</option>
                        <option value={5}>5 days</option>
                        <option value={7}>7 days</option>
                        <option value={10}>10 days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Buy It Now Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={listingData.buy_it_now_price}
                          onChange={(e) => handleInputChange('buy_it_now_price', e.target.value)}
                          className="w-full pl-8 p-2 border rounded-lg"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reserve Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={listingData.reserve_price}
                          onChange={(e) => handleInputChange('reserve_price', e.target.value)}
                          className="w-full pl-8 p-2 border rounded-lg"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Shipping Section */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Shipping</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="calculated"
                          checked={listingData.shipping_type === 'calculated'}
                          onChange={(e) => handleInputChange('shipping_type', e.target.value)}
                          className="mr-2"
                        />
                        Calculated (buyer pays actual shipping)
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="flat"
                          checked={listingData.shipping_type === 'flat'}
                          onChange={(e) => handleInputChange('shipping_type', e.target.value)}
                          className="mr-2"
                        />
                        Flat rate
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Package Weight</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={listingData.package_weight_pounds}
                          onChange={(e) => handleInputChange('package_weight_pounds', e.target.value)}
                          className="w-20 p-2 border rounded-lg"
                          min="0"
                        />
                        <span className="text-sm text-gray-500 pt-2">lbs</span>
                        <input
                          type="number"
                          value={listingData.package_weight_ounces}
                          onChange={(e) => handleInputChange('package_weight_ounces', e.target.value)}
                          className="w-20 p-2 border rounded-lg"
                          min="0"
                          max="15"
                        />
                        <span className="text-sm text-gray-500 pt-2">oz</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Package Size (inches)</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={listingData.package_length}
                          onChange={(e) => handleInputChange('package_length', e.target.value)}
                          className="w-16 p-2 border rounded-lg"
                          placeholder="L"
                        />
                        <span className="text-gray-500 pt-2">×</span>
                        <input
                          type="number"
                          value={listingData.package_width}
                          onChange={(e) => handleInputChange('package_width', e.target.value)}
                          className="w-16 p-2 border rounded-lg"
                          placeholder="W"
                        />
                        <span className="text-gray-500 pt-2">×</span>
                        <input
                          type="number"
                          value={listingData.package_height}
                          onChange={(e) => handleInputChange('package_height', e.target.value)}
                          className="w-16 p-2 border rounded-lg"
                          placeholder="H"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Handling Time</label>
                      <select
                        value={listingData.handling_time}
                        onChange={(e) => handleInputChange('handling_time', e.target.value)}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value={1}>1 business day</option>
                        <option value={2}>2 business days</option>
                        <option value={3}>3 business days</option>
                        <option value={5}>5 business days</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="international"
                      checked={listingData.international_shipping}
                      onChange={(e) => handleInputChange('international_shipping', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="international" className="text-sm">Offer international shipping</label>
                  </div>
                </div>
              </div>

              {/* Returns Section */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Returns</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="returns"
                      checked={listingData.returns_accepted}
                      onChange={(e) => handleInputChange('returns_accepted', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="returns" className="text-sm">Accept returns</label>
                  </div>

                  {listingData.returns_accepted && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Return Period</label>
                        <select
                          value={listingData.return_period}
                          onChange={(e) => handleInputChange('return_period', e.target.value)}
                          className="w-full p-2 border rounded-lg"
                        >
                          <option value={14}>14 days</option>
                          <option value={30}>30 days</option>
                          <option value={60}>60 days</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Return Shipping Paid By</label>
                        <select
                          value={listingData.return_shipping_paid_by}
                          onChange={(e) => handleInputChange('return_shipping_paid_by', e.target.value)}
                          className="w-full p-2 border rounded-lg"
                        >
                          <option value="buyer">Buyer</option>
                          <option value="seller">Seller</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Description</h3>
                <textarea
                  value={listingData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={8}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Describe your item in detail..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Drafts Tab */}
        {activeTab === 'drafts' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Draft Listings</h2>
            </div>
            
            {drafts.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p>No draft listings yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Edited</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {drafts.map((draft) => (
                      <tr key={draft.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{draft.title || 'Untitled'}</td>
                        <td className="px-4 py-3 text-sm">{draft.brand || '-'}</td>
                        <td className="px-4 py-3 text-sm">{draft.size || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          ${draft.buy_it_now_price || draft.starting_bid || '0'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(draft.last_edited).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button className="text-blue-600 hover:text-blue-700 mr-3">Edit</button>
                          <button className="text-red-600 hover:text-red-700">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}