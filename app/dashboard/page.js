'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import CreditDisplay from '../components/CreditDisplay';
import { compressImage } from '../utils/imageCompression';

export default function Dashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  // Check for success message from Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      // Show success message
      const message = document.createElement('div');
      message.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      message.innerHTML = `
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Payment successful! Your credits have been added.
        </div>
      `;
      document.body.appendChild(message);
      
      // Remove message after 5 seconds
      setTimeout(() => {
        message.remove();
      }, 5000);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // States for the listing builder
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [sizeType, setSizeType] = useState('UK');
  const [condition, setCondition] = useState('Good');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [shippingPolicy, setShippingPolicy] = useState('standard');
  const [returnPolicy, setReturnPolicy] = useState('returns30');
  const [dispatchTime, setDispatchTime] = useState('1');
  
  // Load saved drafts
  const [drafts, setDrafts] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  
  // Check if editing a listing from history page
  useEffect(() => {
    const editData = sessionStorage.getItem('editListing');
    if (editData) {
      const listing = JSON.parse(editData);
      
      // Populate all form fields with the listing data
      setTitle(listing.title || '');
      setCategory(listing.category || '');
      setBrand(listing.brand || '');
      setSize(listing.size || '');
      setSizeType(listing.sizeType || 'UK');
      setCondition(listing.condition || 'Good');
      setDescription(listing.description || '');
      setPrice(listing.price || listing.estimatedPrice?.mid || '');
      setSku(listing.sku || '');
      setShippingPolicy(listing.shippingPolicy || 'standard');
      setReturnPolicy(listing.returnPolicy || 'returns30');
      setDispatchTime(listing.dispatchTime || '1');
      
      // Handle images if they exist
      if (listing.images && listing.images.length > 0) {
        setImages(listing.images.map((img, index) => ({
          ...img,
          id: img.id || Date.now() + index,
          file: null // Can't restore file objects from storage
        })));
      }
      
      // Set as selected draft if it has an ID
      if (listing.id) {
        setSelectedDraft(listing);
      }
      
      // Clear the session storage
      sessionStorage.removeItem('editListing');
      
      // Show a message that we're editing
      const message = document.createElement('div');
      message.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      message.textContent = 'Editing listing from history';
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 3000);
    }
  }, []);
  
  useEffect(() => {
    const savedDrafts = localStorage.getItem('lightlister_drafts');
    if (savedDrafts) {
      setDrafts(JSON.parse(savedDrafts));
    }
  }, []);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Handle drag and drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    handleFiles(files);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    const remainingSlots = 24 - images.length;
    const filesToProcess = files.slice(0, remainingSlots);
    
    const compressedImages = await Promise.all(
      filesToProcess.map(async (file) => {
        try {
          const compressed = await compressImage(file, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.8
          });
          
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                file: compressed,
                preview: e.target.result,
                name: file.name,
                id: Date.now() + Math.random()
              });
            };
            reader.readAsDataURL(compressed);
          });
        } catch (error) {
          console.error('Error compressing image:', error);
          return null;
        }
      })
    );
    
    const validImages = compressedImages.filter(img => img !== null);
    setImages(prev => [...prev, ...validImages]);
  };

  // Remove image
  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  // AI Analysis
  const handleAnalyze = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append(`image${index}`, image.file);
      });

      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.type === 'INSUFFICIENT_CREDITS') {
          setError(`Insufficient credits. You need ${data.creditsNeeded} credits but have ${data.creditsAvailable}.`);
          // Optionally redirect to pricing
          setTimeout(() => {
            router.push('/pricing');
          }, 3000);
        } else {
          throw new Error(data.error || 'Analysis failed');
        }
        return;
      }

      setAnalysisResult(data);
      
      // Auto-fill form with AI results
      if (data.items && data.items[0]) {
        const item = data.items[0];
        setTitle(item.ebayTitle || item.title || '');
        setCategory(item.itemType || item.category || '');
        setBrand(item.brand?.name || '');
        setSize(item.size?.value || '');
        setSizeType(item.size?.type || 'UK');
        setCondition(item.condition?.description || 'Good');
        setDescription(item.description || '');
        setPrice(item.estimatedPrice?.mid || '');
        setSku(item.sku || `SKU-${Date.now()}`);
      }
      
      // Reload credit display
      window.location.reload();
      
    } catch (error) {
      setError(error.message || 'Failed to analyze images. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save as draft
  const saveDraft = () => {
    const draft = {
      id: selectedDraft?.id || Date.now(),
      title,
      category,
      brand,
      size,
      sizeType,
      condition,
      description,
      price,
      sku,
      shippingPolicy,
      returnPolicy,
      dispatchTime,
      images: images.map(img => ({
        preview: img.preview,
        name: img.name
      })),
      savedAt: new Date().toISOString()
    };
    
    let updatedDrafts;
    if (selectedDraft) {
      updatedDrafts = drafts.map(d => d.id === selectedDraft.id ? draft : d);
    } else {
      updatedDrafts = [draft, ...drafts];
    }
    
    // Keep only last 10 drafts
    updatedDrafts = updatedDrafts.slice(0, 10);
    
    setDrafts(updatedDrafts);
    localStorage.setItem('lightlister_drafts', JSON.stringify(updatedDrafts));
    
    // Show success message
    const message = document.createElement('div');
    message.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    message.textContent = 'Draft saved successfully!';
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
  };

  // Load draft
  const loadDraft = (draft) => {
    setSelectedDraft(draft);
    setTitle(draft.title || '');
    setCategory(draft.category || '');
    setBrand(draft.brand || '');
    setSize(draft.size || '');
    setSizeType(draft.sizeType || 'UK');
    setCondition(draft.condition || 'Good');
    setDescription(draft.description || '');
    setPrice(draft.price || '');
    setSku(draft.sku || '');
    setShippingPolicy(draft.shippingPolicy || 'standard');
    setReturnPolicy(draft.returnPolicy || 'returns30');
    setDispatchTime(draft.dispatchTime || '1');
    
    // Note: We can't restore the actual image files, just the previews
    if (draft.images) {
      setImages(draft.images.map((img, index) => ({
        ...img,
        id: Date.now() + index,
        file: null // Can't restore file objects
      })));
    }
  };

  // Delete draft
  const deleteDraft = (draftId) => {
    const updatedDrafts = drafts.filter(d => d.id !== draftId);
    setDrafts(updatedDrafts);
    localStorage.setItem('lightlister_drafts', JSON.stringify(updatedDrafts));
    
    if (selectedDraft?.id === draftId) {
      setSelectedDraft(null);
    }
  };

  // Clear form
  const clearForm = () => {
    setImages([]);
    setTitle('');
    setCategory('');
    setBrand('');
    setSize('');
    setSizeType('UK');
    setCondition('Good');
    setDescription('');
    setPrice('');
    setSku('');
    setShippingPolicy('standard');
    setReturnPolicy('returns30');
    setDispatchTime('1');
    setSelectedDraft(null);
    setAnalysisResult(null);
    setError(null);
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
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
                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <CreditDisplay userId={user?.id} />
              <span className="text-sm text-gray-600">
                {user?.emailAddresses?.[0]?.emailAddress}
              </span>
              <Link 
                href="/pricing"
                className="text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Get Credits
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => document.getElementById('file-upload').click()}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Listing
                </button>
                
                <Link 
                  href="/batch"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Batch Upload
                  <span className="ml-2 px-2 py-1 bg-purple-500 text-xs rounded">BETA</span>
                </Link>
                
                <Link 
                  href="/history"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Listing History
                </Link>
              </div>
            </div>

            {/* Image Upload Area */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Upload Photos</h2>
              
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                
                <p className="mt-2 text-sm text-gray-600">
                  Drag and drop your photos here, or click to select
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Up to 24 photos per listing • JPG, PNG up to 10MB each
                </p>
              </div>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">{images.length} / 24 photos</span>
                    <button
                      onClick={() => setImages([])}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove all
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-6 gap-2">
                    {images.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.preview}
                          alt={image.name}
                          className="w-full h-20 object-cover rounded"
                        />
                        <button
                          onClick={() => removeImage(image.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze with AI (1 Credit)'}
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                  {error}
                </div>
              )}
            </div>

            {/* Listing Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Listing Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Ladies Zara Black Dress Size 12 BNWT"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., Dress"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., Zara"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                    <input
                      type="text"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., 12"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size Type</label>
                    <select
                      value={sizeType}
                      onChange={(e) => setSizeType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="UK">UK</option>
                      <option value="EU">EU</option>
                      <option value="US">US</option>
                      <option value="IT">IT</option>
                      <option value="FR">FR</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="New with tags">New with tags</option>
                      <option value="New without tags">New without tags</option>
                      <option value="Very Good">Very Good</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Describe the item in detail..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (£)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., ZAR-DRS-001"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Business Policies</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shipping</label>
                      <select
                        value={shippingPolicy}
                        onChange={(e) => setShippingPolicy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="standard">Standard (£3.99)</option>
                        <option value="tracked">Tracked (£4.99)</option>
                        <option value="express">Express (£9.99)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Returns</label>
                      <select
                        value={returnPolicy}
                        onChange={(e) => setReturnPolicy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="returns30">30 Day Returns</option>
                        <option value="returns14">14 Day Returns</option>
                        <option value="noreturns">No Returns</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch</label>
                      <select
                        value={dispatchTime}
                        onChange={(e) => setDispatchTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="1">1 Business Day</option>
                        <option value="2">2 Business Days</option>
                        <option value="3">3 Business Days</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={saveDraft}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Save as Draft
                  </button>
                  
                  <button
                    onClick={clearForm}
                    className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                  >
                    Clear Form
                  </button>
                  
                  <button
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    List on eBay
                  </button>
                  
                  <button
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    List on Vinted
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* AI Analysis Results */}
            {analysisResult && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold mb-4">AI Analysis Results</h3>
                <div className="space-y-3 text-sm">
                  {analysisResult.items?.[0] && (
                    <>
                      <div>
                        <span className="text-gray-600">Brand:</span>
                        <span className="ml-2 font-medium">{analysisResult.items[0].brand?.name || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Item Type:</span>
                        <span className="ml-2 font-medium">{analysisResult.items[0].itemType || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Condition:</span>
                        <span className="ml-2 font-medium">{analysisResult.items[0].condition?.description || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Est. Value:</span>
                        <span className="ml-2 font-medium">
                          £{analysisResult.items[0].estimatedPrice?.min || 0} - £{analysisResult.items[0].estimatedPrice?.max || 0}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Saved Drafts */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold mb-4">Saved Drafts ({drafts.length})</h3>
              
              {drafts.length === 0 ? (
                <p className="text-sm text-gray-500">No saved drafts yet</p>
              ) : (
                <div className="space-y-3">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {draft.title || 'Untitled Draft'}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(draft.savedAt).toLocaleDateString()} • {draft.images?.length || 0} photos
                          </p>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={() => loadDraft(draft)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Load draft"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteDraft(draft.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete draft"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Listings Today</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">This Week</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">This Month</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-3">
                Check out our guides or contact support.
              </p>
              <div className="space-y-2">
                <Link href="/help" className="block text-sm text-blue-600 hover:text-blue-800">
                  View Help Center →
                </Link>
                <a href="mailto:lightlisterai@outlook.com" className="block text-sm text-blue-600 hover:text-blue-800">
                  Contact Support →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}