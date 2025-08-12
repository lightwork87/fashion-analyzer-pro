'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { compressMultipleImages } from '../utils/imageCompression';
import CreditDisplay from '../components/CreditDisplay';
import { useUserData } from '../hooks/useUserData';
import { supabase } from '../lib/supabase';

// Your Business Policies (configured like eBay)
const BUSINESS_POLICIES = {
  returns: {
    'free_returns_30': {
      name: 'Free returns',
      description: 'Top rated seller +',
      returns_accepted: true,
      return_period: 30,
      return_shipping_paid_by: 'seller',
      domestic_returns: true,
      international_returns: false
    },
    'buyer_pays_returns_14': {
      name: 'Buyer pays return',
      description: 'Standard returns',
      returns_accepted: true,
      return_period: 14,
      return_shipping_paid_by: 'buyer',
      domestic_returns: true,
      international_returns: false
    },
    'no_returns': {
      name: 'No returns',
      description: 'All sales final',
      returns_accepted: false,
      domestic_returns: false,
      international_returns: false
    }
  },
  shipping: {
    'free_shipping_48': {
      name: 'Free shipping',
      description: 'Royal Mail 48',
      postage_service: 'royal_mail_48',
      postage_cost: '0.00',
      dispatch_time: 1,
      shipping_type: 'flat'
    },
    'standard_shipping': {
      name: 'Standard shipping',
      description: '£3.50 Royal Mail 48',
      postage_service: 'royal_mail_48',
      postage_cost: '3.50',
      dispatch_time: 1,
      shipping_type: 'flat'
    },
    'next_day': {
      name: 'Next day delivery',
      description: '£6.95 Royal Mail 24',
      postage_service: 'royal_mail_24',
      postage_cost: '6.95',
      dispatch_time: 1,
      shipping_type: 'flat'
    }
  },
  payment: {
    'standard': {
      name: 'Standard payment',
      description: 'PayPal, Credit/Debit cards',
      payment_methods: ['paypal', 'credit_card', 'debit_card']
    }
  }
};

// eBay UK category-specific requirements
const EBAY_UK_CATEGORIES = {
  'mens_clothing': {
    required: ['brand', 'size', 'colour', 'condition', 'department'],
    optional: ['size_type', 'style', 'material', 'sleeve_length', 'pattern']
  },
  'womens_clothing': {
    required: ['brand', 'size', 'colour', 'condition', 'department', 'size_type'],
    optional: ['style', 'material', 'sleeve_length', 'pattern', 'occasion']
  },
  'shoes': {
    required: ['brand', 'size', 'colour', 'condition', 'department', 'shoe_type'],
    optional: ['width', 'material', 'style', 'occasion']
  }
};

// UK Postage Services
const UK_POSTAGE_SERVICES = {
  'royal_mail_48': 'Royal Mail 48 (2-3 days)',
  'royal_mail_24': 'Royal Mail 24 (1-2 days)',
  'royal_mail_1st': 'Royal Mail 1st Class',
  'royal_mail_2nd': 'Royal Mail 2nd Class',
  'royal_mail_special': 'Royal Mail Special Delivery',
  'hermes': 'Evri (Hermes) Standard',
  'dpd': 'DPD Next Day',
  'collect_plus': 'Collect+ Drop Off',
  'click_collect': 'Click & Collect'
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
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [selectedPolicies, setSelectedPolicies] = useState({
    returns: 'free_returns_30',
    shipping: 'standard_shipping',
    payment: 'standard'
  });
  
  // Listing form state - UK specific
  const [listingData, setListingData] = useState({
    // Basic Info
    title: '',
    sku: '',
    category: 'womens_clothing',
    
    // Item Specifics
    brand: '',
    size: '',
    colour: '', // UK spelling
    material: '',
    condition: 'used',
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
    
    // Pricing (GBP)
    listing_format: 'fixed_price',
    buy_it_now_price: '',
    starting_bid: '',
    reserve_price: '',
    auction_duration: 7,
    best_offer_enabled: false,
    minimum_offer: '',
    auto_accept_offer: '',
    auto_decline_offer: '',
    
    // These will be set by policies
    shipping_type: 'flat',
    postage_service: 'royal_mail_48',
    postage_cost: '3.50',
    package_weight_kg: 0,
    package_weight_g: 200,
    package_length_cm: 30,
    package_width_cm: 25,
    package_depth_cm: 5,
    dispatch_time: 1,
    
    // Returns (set by policy)
    returns_accepted: true,
    return_period: 30,
    return_shipping_paid_by: 'buyer',
    
    // Description
    description: ''
  });

  useEffect(() => {
    setMounted(true);
    loadDrafts();
    loadUserPolicies();
  }, []);

  useEffect(() => {
    if (clerkLoaded && !clerkUser) {
      router.push('/sign-in');
    }
  }, [clerkUser, clerkLoaded, router]);

  useEffect(() => {
    // Apply selected policies to listing data
    applyPoliciesToListing();
  }, [selectedPolicies]);

  const loadUserPolicies = async () => {
    // Load user's saved policy preferences from database
    if (!clerkUser) return;
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('default_policies')
        .eq('user_id', clerkUser.id)
        .single();
        
      if (data && data.default_policies) {
        setSelectedPolicies(data.default_policies);
      }
    } catch (err) {
      console.error('Error loading policies:', err);
    }
  };

  const applyPoliciesToListing = () => {
    // Apply returns policy
    if (selectedPolicies.returns && BUSINESS_POLICIES.returns[selectedPolicies.returns]) {
      const returnsPolicy = BUSINESS_POLICIES.returns[selectedPolicies.returns];
      setListingData(prev => ({
        ...prev,
        returns_accepted: returnsPolicy.returns_accepted,
        return_period: returnsPolicy.return_period || 30,
        return_shipping_paid_by: returnsPolicy.return_shipping_paid_by || 'buyer'
      }));
    }
    
    // Apply shipping policy
    if (selectedPolicies.shipping && BUSINESS_POLICIES.shipping[selectedPolicies.shipping]) {
      const shippingPolicy = BUSINESS_POLICIES.shipping[selectedPolicies.shipping];
      setListingData(prev => ({
        ...prev,
        postage_service: shippingPolicy.postage_service,
        postage_cost: shippingPolicy.postage_cost,
        dispatch_time: shippingPolicy.dispatch_time,
        shipping_type: shippingPolicy.shipping_type
      }));
    }
  };

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
      
      // Pre-fill form with AI results (converted to GBP)
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        
        // Convert USD prices to GBP (rough conversion)
        const minPriceGBP = item.estimatedPrice?.min ? (item.estimatedPrice.min * 0.8).toFixed(2) : '';
        const maxPriceGBP = item.estimatedPrice?.max ? (item.estimatedPrice.max * 0.8).toFixed(2) : '';
        
        setListingData(prev => ({
          ...prev,
          title: item.ebayTitle || '',
          sku: item.sku || '',
          brand: item.brand?.name !== 'Unknown' ? item.brand.name : '',
          size: item.size !== 'Not Visible' ? item.size : '',
          colour: item.color || '', // Note: using 'colour' for UK
          material: item.material !== 'Not Specified' ? item.material : '',
          condition: item.condition?.score >= 9 ? 'new_with_tags' : 
                    item.condition?.score >= 7 ? 'new_without_tags' :
                    item.condition?.score >= 5 ? 'very_good' : 'used',
          condition_description: item.condition?.description || '',
          description: item.description || '',
          buy_it_now_price: maxPriceGBP,
          starting_bid: minPriceGBP,
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
          // Save which policies were used
          returns_policy: selectedPolicies.returns,
          shipping_policy: selectedPolicies.shipping,
          payment_policy: selectedPolicies.payment,
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
    const category = EBAY_UK_CATEGORIES[listingData.category];
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

  const PolicySelector = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-blue-900">Business Policies</h3>
        <button
          onClick={() => setShowPolicyModal(true)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Manage Policies
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Returns Policy</label>
          <select
            value={selectedPolicies.returns}
            onChange={(e) => setSelectedPolicies(prev => ({ ...prev, returns: e.target.value }))}
            className="w-full p-2 border rounded bg-white"
          >
            {Object.entries(BUSINESS_POLICIES.returns).map(([key, policy]) => (
              <option key={key} value={key}>{policy.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {BUSINESS_POLICIES.returns[selectedPolicies.returns]?.description}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Policy</label>
          <select
            value={selectedPolicies.shipping}
            onChange={(e) => setSelectedPolicies(prev => ({ ...prev, shipping: e.target.value }))}
            className="w-full p-2 border rounded bg-white"
          >
            {Object.entries(BUSINESS_POLICIES.shipping).map(([key, policy]) => (
              <option key={key} value={key}>{policy.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {BUSINESS_POLICIES.shipping[selectedPolicies.shipping]?.description}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Policy</label>
          <select
            value={selectedPolicies.payment}
            onChange={(e) => setSelectedPolicies(prev => ({ ...prev, payment: e.target.value }))}
            className="w-full p-2 border rounded bg-white"
          >
            {Object.entries(BUSINESS_POLICIES.payment).map(([key, policy]) => (
              <option key={key} value={key}>{policy.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {BUSINESS_POLICIES.payment[selectedPolicies.payment]?.description}
          </p>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-600">
        <span className="inline-flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          These policies will be applied to all listings. You can override individual settings below.
        </span>
      </div>
    </div>
  );

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
              <div className="flex items-center gap-2">
                <Image 
                  src="/logo.png" 
                  alt="LightLister AI" 
                  width={32} 
                  height={32}
                  className="h-8 w-auto"
                />
                <h1 className="text-xl font-bold text-gray-900">LightLister AI</h1>
              </div>
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
                <button
                  onClick={() => setActiveTab('policies')}
                  className={`px-3 py-1 rounded ${activeTab === 'policies' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                >
                  Policies
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
            
            {/* Policy Selector */}
            <PolicySelector />
            
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
                  {analyzing ? 'Analysing...' : `Analyse Images (1 Credit)`}
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
            {/* Policy Selector at top of form too */}
            <PolicySelector />
            
            {/* eBay UK Listing Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">eBay UK Listing Details</h2>
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
                        alert('Ready to list on eBay UK!');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    List on eBay UK
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
                      placeholder="Next, M&S, Primark, etc."
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
                      placeholder="10, 12, 14, S, M, L, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Colour <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={listingData.colour}
                      onChange={(e) => handleInputChange('colour', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Black, Navy, Red, etc."
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
                      <option value="very_good">Very good</option>
                      <option value="good">Good</option>
                      <option value="used">Used</option>
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
                      <option value="Unisex">Unisex Adults</option>
                      <option value="Boys">Boys</option>
                      <option value="Girls">Girls</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                    <input
                      type="text"
                      value={listingData.material}
                      onChange={(e) => handleInputChange('material', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Cotton, Polyester, Wool, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                    <input
                      type="text"
                      value={listingData.style}
                      onChange={(e) => handleInputChange('style', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Casual, Smart, Formal, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pattern</label>
                    <input
                      type="text"
                      value={listingData.pattern}
                      onChange={(e) => handleInputChange('pattern', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Plain, Striped, Floral, etc."
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
                      <option value="spring_summer">Spring/Summer</option>
                      <option value="autumn_winter">Autumn/Winter</option>
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

              {/* Pricing Section - GBP */}
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
                        <span className="absolute left-3 top-2 text-gray-500">£</span>
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
                            <span className="absolute left-2 top-1 text-gray-500 text-sm">£</span>
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
                            <span className="absolute left-2 top-1 text-gray-500 text-sm">£</span>
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
                            <span className="absolute left-2 top-1 text-gray-500 text-sm">£</span>
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
                        <span className="absolute left-3 top-2 text-gray-500">£</span>
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
                        <span className="absolute left-3 top-2 text-gray-500">£</span>
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
                        <span className="absolute left-3 top-2 text-gray-500">£</span>
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

              {/* Applied Policies Summary */}
              <div className="border-t pt-6 mt-6 bg-gray-50 -mx-6 -mb-6 px-6 pb-6">
                <h3 className="text-lg font-semibold mb-4">Applied Policies</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Returns:</span> {BUSINESS_POLICIES.returns[selectedPolicies.returns]?.name}
                  </div>
                  <div>
                    <span className="font-medium">Shipping:</span> {BUSINESS_POLICIES.shipping[selectedPolicies.shipping]?.name}
                  </div>
                  <div>
                    <span className="font-medium">Payment:</span> {BUSINESS_POLICIES.payment[selectedPolicies.payment]?.name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Business Policies</h2>
              <p className="text-gray-600 mt-2">Manage your default policies for all listings</p>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Returns Policies */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Returns Policies</h3>
                <div className="space-y-3">
                  {Object.entries(BUSINESS_POLICIES.returns).map(([key, policy]) => (
                    <div key={key} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{policy.name}</h4>
                          <p className="text-sm text-gray-600">{policy.description}</p>
                          <div className="mt-2 text-xs text-gray-500">
                            {policy.returns_accepted ? (
                              <>Returns accepted within {policy.return_period} days • {policy.return_shipping_paid_by === 'seller' ? 'Free returns' : 'Buyer pays return postage'}</>
                            ) : (
                              'No returns accepted'
                            )}
                          </div>
                        </div>
                        <button className="text-blue-600 text-sm hover:underline">Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Policies */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Shipping Policies</h3>
                <div className="space-y-3">
                  {Object.entries(BUSINESS_POLICIES.shipping).map(([key, policy]) => (
                    <div key={key} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{policy.name}</h4>
                          <p className="text-sm text-gray-600">{policy.description}</p>
                          <div className="mt-2 text-xs text-gray-500">
                            £{policy.postage_cost} • Dispatch in {policy.dispatch_time} working day{policy.dispatch_time > 1 ? 's' : ''}
                          </div>
                        </div>
                        <button className="text-blue-600 text-sm hover:underline">Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Policy Button */}
              <div className="pt-4 border-t">
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Create New Policy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drafts Tab - Updated to show policies */}
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