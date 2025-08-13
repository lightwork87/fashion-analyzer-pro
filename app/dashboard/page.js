'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import CreditDisplay from '../components/CreditDisplay';
import { compressImage } from '../utils/imageCompression';

const generateSKU = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `LL-${timestamp}-${random}`.toUpperCase();
};

const clothingSizes = {
  womens: {
    UK: ['4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24'],
    EU: ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52'],
    US: ['0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20']
  },
  mens: {
    UK: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    Chest: ['34"', '36"', '38"', '40"', '42"', '44"', '46"', '48"', '50"', '52"'],
    Waist: ['26"', '28"', '30"', '32"', '34"', '36"', '38"', '40"', '42"', '44"']
  },
  shoes: {
    UK: ['3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'],
    EU: ['35', '35.5', '36', '37', '37.5', '38', '38.5', '39', '40', '40.5', '41', '42', '42.5', '43', '44', '44.5', '45', '46', '47'],
    US: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '13.5', '14']
  }
};

const businessPolicies = {
  returns: {
    name: "30 Day Returns",
    description: "We accept returns within 30 days of purchase. Items must be in the same condition as received."
  },
  shipping: {
    name: "Standard Shipping",
    description: "Items dispatched within 1 business day via Royal Mail. Tracking provided."
  },
  payment: {
    name: "Secure Payment",
    description: "We accept all major payment methods through secure payment processing."
  }
};

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [activeTab, setActiveTab] = useState('upload');
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    brand: '',
    size: '',
    sizeType: 'UK',
    color: '',
    condition: 'Used',
    conditionScore: 7,
    description: '',
    measurements: {
      chest: '',
      length: '',
      shoulders: '',
      sleeves: '',
      waist: '',
      hips: '',
      inseam: '',
      rise: ''
    },
    material: '',
    features: [],
    flaws: '',
    price: '',
    quantity: 1,
    sku: generateSKU(),
    shippingPolicy: businessPolicies.shipping.name,
    returnPolicy: businessPolicies.returns.name,
    paymentPolicy: businessPolicies.payment.name,
    ukSpecific: {
      dispatchTime: '1',
      postalService: 'Royal Mail 2nd Class',
      itemLocation: 'United Kingdom',
      ukSizeChart: true
    }
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [creditInfo, setCreditInfo] = useState(null);

  const handleEmailSupport = () => {
    window.location.href = 'mailto:lightlisterai@outlook.com?subject=LightLister%20AI%20-%20Support%20Request';
  };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.id === 'drop-zone') {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    await processFiles(files);
  }, []);

  const processFiles = async (files) => {
    const newImages = [];
    
    for (let i = 0; i < files.length && images.length + newImages.length < 24; i++) {
      const file = files[i];
      const id = `${Date.now()}-${i}`;
      
      setUploadProgress(prev => ({ ...prev, [id]: 0 }));
      
      try {
        const compressedFile = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.9,
          onProgress: (progress) => {
            setUploadProgress(prev => ({ ...prev, [id]: progress }));
          }
        });
        
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push({
            id,
            file: compressedFile,
            preview: e.target.result,
            name: file.name,
            size: compressedFile.size
          });
          
          if (i === files.length - 1 || images.length + newImages.length >= 24) {
            setImages(prev => [...prev, ...newImages]);
            setTimeout(() => {
              setUploadProgress(prev => {
                const updated = { ...prev };
                newImages.forEach(img => delete updated[img.id]);
                return updated;
              });
            }, 1000);
          }
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error processing image:', error);
        setError(`Failed to process ${file.name}`);
      }
    }
  };

  const handleImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files).filter(file => 
      file.type.startsWith('image/')
    );
    await processFiles(files);
  }, [images.length]);

  const removeImage = useCallback((id) => {
    setImages(prev => prev.filter(img => img.id !== id));
    if (previewImage?.id === id) {
      setPreviewImage(null);
    }
  }, [previewImage]);

  const handleAnalyze = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setActiveTab('results');

    try {
      const formDataToSend = new FormData();
      images.forEach((image, index) => {
        formDataToSend.append(`image${index}`, image.file);
      });

      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.type === 'INSUFFICIENT_CREDITS') {
          setShowUpgradeModal(true);
          setCreditInfo(data);
        }
        throw new Error(data.error || 'Analysis failed');
      }

      if (data.creditInfo) {
        setCreditInfo(data.creditInfo);
      }

      if (data.items && data.items.length > 0) {
        const result = data.items[0];
        setAnalysisResult(result);
        
        setFormData(prev => ({
          ...prev,
          title: result.ebayTitle || '',
          category: result.category || result.itemType || '',
          brand: result.brand?.name || '',
          size: result.size?.value || '',
          sizeType: result.size?.type || 'UK',
          color: result.color || '',
          condition: mapConditionScore(result.condition?.score),
          conditionScore: result.condition?.score || 7,
          description: result.description || '',
          material: result.material || '',
          features: result.features || [],
          flaws: result.condition?.notes || '',
          price: result.estimatedPrice?.mid || '',
          sku: result.sku || generateSKU()
        }));
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.message || 'Failed to analyze images. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const mapConditionScore = (score) => {
    if (score >= 9) return 'New with tags';
    if (score >= 8) return 'New without tags';
    if (score >= 7) return 'Excellent';
    if (score >= 5) return 'Good';
    if (score >= 3) return 'Fair';
    return 'Poor';
  };

  const saveDraft = () => {
    const draft = {
      id: Date.now(),
      ...formData,
      images: images.map(img => ({
        name: img.name,
        preview: img.preview
      })),
      savedAt: new Date().toISOString()
    };
    
    const drafts = JSON.parse(localStorage.getItem('lightlister_drafts') || '[]');
    drafts.unshift(draft);
    if (drafts.length > 10) drafts.pop();
    localStorage.setItem('lightlister_drafts', JSON.stringify(drafts));
    setSavedDrafts(drafts);
    setError(null);
    alert('Draft saved successfully!');
  };

  const loadDraft = (draft) => {
    setFormData(draft);
    setActiveTab('results');
  };

  const deleteDraft = (id) => {
    const drafts = savedDrafts.filter(d => d.id !== id);
    localStorage.setItem('lightlister_drafts', JSON.stringify(drafts));
    setSavedDrafts(drafts);
  };

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      router.push('/sign-in');
      return;
    }

    const drafts = JSON.parse(localStorage.getItem('lightlister_drafts') || '[]');
    setSavedDrafts(drafts);
  }, [user, isLoaded, router]);

  const conditionDescriptions = {
    'New with tags': 'Brand new item with original tags attached',
    'New without tags': 'Brand new item without tags',
    'Excellent': 'Worn once or twice, no visible signs of wear',
    'Good': 'Gently worn with minimal signs of wear',
    'Fair': 'Obviously worn with some signs of wear',
    'Poor': 'Heavily worn with significant signs of wear'
  };

  const availableFeatures = [
    'Designer', 'Vintage', 'Limited Edition', 'Handmade', 'Sustainable',
    'Plus Size', 'Petite', 'Tall', 'Maternity', 'Unisex'
  ];

  const toggleFeature = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const imageUploadSection = useMemo(() => (
    <div className="space-y-4">
      <div
        id="drop-zone"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="sr-only"
          id="image-upload"
          disabled={images.length >= 24}
        />
        <label
          htmlFor="image-upload"
          className="cursor-pointer"
        >
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            {images.length >= 24 
              ? 'Maximum 24 images reached'
              : 'Drop images here or click to upload'
            }
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {24 - images.length} slots remaining • Max 24 images • JPG, PNG up to 10MB each
          </p>
        </label>
      </div>

      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([id, progress]) => (
            <div key={id} className="bg-gray-100 rounded-lg p-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="mt-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={image.preview}
                alt={image.name}
                className="w-full h-32 object-cover rounded-lg cursor-pointer"
                onClick={() => setPreviewImage(image)}
              />
              <button
                onClick={() => removeImage(image.id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                {(image.size / 1024 / 1024).toFixed(1)}MB
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  ), [images, isDragging, uploadProgress, handleDragEnter, handleDragOver, handleDragLeave, handleDrop, handleImageUpload, removeImage]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image 
                  src="/logo.png" 
                  alt="LightLister AI" 
                  width={32} 
                  height={32}
                  className="h-8 w-auto mr-3"
                />
                <h1 className="text-xl font-bold text-gray-900">LightLister AI</h1>
              </Link>
              <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                BETA
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <CreditDisplay />
              <button
                onClick={handleEmailSupport}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Support
              </button>
              <Link 
                href="/pricing"
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Upgrade
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upload Images
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              disabled={!analysisResult && !formData.title}
            >
              Listing Details
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'drafts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Saved Drafts ({savedDrafts.length})
            </button>
          </nav>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Upload Fashion Images</h2>
            {imageUploadSection}
            
            {images.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isAnalyzing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing {images.length} {images.length === 1 ? 'image' : 'images'}...
                    </span>
                  ) : (
                    `Analyze ${images.length} ${images.length === 1 ? 'Image' : 'Images'} (1 Credit)`
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            {/* AI Analysis Results */}
            {analysisResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">AI Analysis Complete!</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p>✓ Brand: {analysisResult.brand?.name || 'Unknown'} (Confidence: {analysisResult.brand?.confidence || 'N/A'})</p>
                  <p>✓ Category: {analysisResult.category || analysisResult.itemType}</p>
                  <p>✓ Condition: {analysisResult.condition?.score}/10 - {analysisResult.condition?.description}</p>
                  <p>✓ Estimated Value: £{analysisResult.estimatedPrice?.min} - £{analysisResult.estimatedPrice?.max}</p>
                </div>
              </div>
            )}

            {/* Listing Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Listing Details</h2>
              
              <form className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (eBay Optimized)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    maxLength={80}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.title.length}/80 characters</p>
                </div>

                {/* Category and Brand */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.sizeType}
                      onChange={(e) => setFormData({...formData, sizeType: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="UK">UK</option>
                      <option value="EU">EU</option>
                      <option value="US">US</option>
                    </select>
                    <input
                      type="text"
                      value={formData.size}
                      onChange={(e) => setFormData({...formData, size: e.target.value})}
                      placeholder="Enter size"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({...formData, condition: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(conditionDescriptions).map(([condition, description]) => (
                      <option key={condition} value={condition}>
                        {condition} - {description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Price and SKU */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (£)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Features
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableFeatures.map(feature => (
                      <button
                        key={feature}
                        type="button"
                        onClick={() => toggleFeature(feature)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          formData.features.includes(feature)
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>

                {/* UK Specific Settings */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">UK Shipping Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Dispatch Time
                      </label>
                      <select
                        value={formData.ukSpecific.dispatchTime}
                        onChange={(e) => setFormData({
                          ...formData,
                          ukSpecific: {...formData.ukSpecific, dispatchTime: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="1">1 business day</option>
                        <option value="2">2 business days</option>
                        <option value="3">3 business days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Postal Service
                      </label>
                      <select
                        value={formData.ukSpecific.postalService}
                        onChange={(e) => setFormData({
                          ...formData,
                          ukSpecific: {...formData.ukSpecific, postalService: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Royal Mail 2nd Class">Royal Mail 2nd Class</option>
                        <option value="Royal Mail 1st Class">Royal Mail 1st Class</option>
                        <option value="Royal Mail Tracked 48">Royal Mail Tracked 48</option>
                        <option value="Royal Mail Tracked 24">Royal Mail Tracked 24</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Item Location
                      </label>
                      <input
                        type="text"
                        value={formData.ukSpecific.itemLocation}
                        onChange={(e) => setFormData({
                          ...formData,
                          ukSpecific: {...formData.ukSpecific, itemLocation: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    List on eBay
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    List on Vinted
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Drafts Tab */}
        {activeTab === 'drafts' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Saved Drafts</h2>
            {savedDrafts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No saved drafts yet</p>
            ) : (
              <div className="space-y-4">
                {savedDrafts.map(draft => (
                  <div key={draft.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{draft.title || 'Untitled Draft'}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {draft.brand} • {draft.category} • {draft.size}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Saved {new Date(draft.savedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => loadDraft(draft)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteDraft(draft.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-4xl max-h-full">
            <img
              src={previewImage.preview}
              alt={previewImage.name}
              className="max-w-full max-h-full object-contain"
            />
            <p className="text-white text-center mt-2">{previewImage.name}</p>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Insufficient Credits</h3>
            <p className="text-gray-600 mb-4">
              You need {creditInfo?.creditsNeeded || 1} credit to analyze these images. 
              You currently have {creditInfo?.creditsAvailable || 0} credits.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <Link
                href="/pricing"
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
              >
                Get More Credits
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}