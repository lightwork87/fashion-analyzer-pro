'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useUserData } from '../../hooks/useUserData';
import Link from 'next/link';

export default function NewListing() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { user, loading: userLoading } = useUserData();
  const fileInputRef = useRef(null);
  
  const [images, setImages] = useState([]);
  const [listing, setListing] = useState({
    title: '',
    brand: '',
    category: '',
    subcategory: '',
    size: '',
    sizeType: 'Regular',
    condition: 'Good',
    conditionNotes: '',
    color: '',
    material: '',
    style: '',
    price: '',
    description: '',
    // eBay specific
    itemSpecifics: {},
    shippingPolicy: '',
    paymentPolicy: '',
    returnPolicy: '',
    // Vinted specific
    vintedCategory: '',
    vintedSubcategory: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [platform, setPlatform] = useState('ebay'); // ebay or vinted

  const conditions = [
    'New with tags',
    'New without tags',
    'New with defects',
    'Excellent',
    'Very Good',
    'Good',
    'Fair',
    'Poor'
  ];

  const ebayCategories = {
    'Women\'s Clothing': ['Dresses', 'Tops & Shirts', 'Coats & Jackets', 'Jeans', 'Trousers', 'Skirts', 'Shoes', 'Bags'],
    'Men\'s Clothing': ['Shirts', 'T-Shirts', 'Jackets & Coats', 'Jeans', 'Trousers', 'Shoes', 'Accessories'],
    'Kids\' Clothing': ['Girls', 'Boys', 'Baby', 'Shoes']
  };

  const vintedCategories = {
    'Women': ['Coats & Jackets', 'Dresses', 'Tops & T-shirts', 'Shirts & Blouses', 'Knitwear', 'Trousers', 'Jeans', 'Skirts', 'Shorts', 'Jumpsuits & Playsuits', 'Shoes', 'Bags & Purses', 'Accessories', 'Jewelry', 'Beauty'],
    'Men': ['Jackets & Coats', 'Shirts', 'T-shirts', 'Knitwear', 'Sweatshirts', 'Trousers', 'Jeans', 'Shorts', 'Shoes', 'Bags', 'Accessories'],
    'Kids': ['Girls\' Clothing', 'Boys\' Clothing', 'Girls\' Shoes', 'Boys\' Shoes', 'Baby Clothes', 'Baby Shoes', 'Toys & Games']
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImages([...images, ...newImages].slice(0, 24)); // Max 24 images
  };

  const removeImage = (index) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleAIAnalysis = async () => {
    if (images.length === 0 || !user) return;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      images.forEach(img => {
        formData.append('images', img.file);
      });
      formData.append('userId', clerkUser.id);

      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      
      // Update listing with AI results
      setListing(prev => ({
        ...prev,
        title: data.title || prev.title,
        brand: data.brand || prev.brand,
        category: data.category || prev.category,
        size: data.size || prev.size,
        condition: data.condition || prev.condition,
        color: data.color || prev.color,
        material: data.material || prev.material,
        style: data.style || prev.style,
        price: data.price || data.estimated_value_min || prev.price,
        description: data.description || prev.description,
        itemSpecifics: data.itemSpecifics || {}
      }));

    } catch (error) {
      console.error('AI analysis error:', error);
      alert('Failed to analyze images. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async (isDraft = false) => {
    setIsSaving(true);
    try {
      const listingData = {
        ...listing,
        images: images.map(img => img.preview),
        platform,
        status: isDraft ? 'draft' : 'ready',
        userId: clerkUser.id
      };

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(listingData)
      });

      if (!response.ok) {
        throw new Error('Failed to save listing');
      }

      const data = await response.json();
      
      if (isDraft) {
        alert('Draft saved successfully!');
      } else if (platform === 'ebay') {
        // Redirect to eBay listing
        router.push(`/list/ebay/${data.id}`);
      } else {
        // For Vinted, show CSV export
        exportVintedCSV([listing]);
      }

    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save listing. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportVintedCSV = (items) => {
    const headers = ['Title', 'Brand', 'Size', 'Condition', 'Price', 'Category', 'Subcategory', 'Color', 'Material', 'Description'];
    const rows = items.map(item => [
      item.title,
      item.brand,
      item.size,
      item.condition,
      item.price,
      item.vintedCategory,
      item.vintedSubcategory,
      item.color,
      item.material,
      item.description.replace(/,/g, ';')
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vinted_listing.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const canAnalyze = images.length > 0 && user && (
    (user.credits_total + user.bonus_credits - user.credits_used) > 0
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Create New Listing</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {/* Platform Selector */}
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setPlatform('ebay')}
                className={`flex-1 py-4 px-6 text-center font-medium ${
                  platform === 'ebay'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                List on eBay
              </button>
              <button
                onClick={() => setPlatform('vinted')}
                className={`flex-1 py-4 px-6 text-center font-medium ${
                  platform === 'vinted'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                List on Vinted
              </button>
            </div>
          </div>

          <div className="p-8">
            {/* Image Upload Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={img.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                {images.length < 24 && (
                  <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-1 text-sm text-gray-600">Add Photo</p>
                    </div>
                  </label>
                )}
              </div>
              
              {canAnalyze && (
                <button
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze with AI (1 credit)'}
                </button>
              )}
            </div>

            {/* Listing Details Form */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={listing.title}
                  onChange={(e) => setListing({...listing, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Nike Air Max 90 Women's Trainers Size 6 White"
                  maxLength={80}
                />
                <p className="mt-1 text-sm text-gray-500">{listing.title.length}/80 characters</p>
              </div>

              {/* Category Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={listing.category}
                    onChange={(e) => setListing({...listing, category: e.target.value, subcategory: ''})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {Object.keys(platform === 'ebay' ? ebayCategories : vintedCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory
                  </label>
                  <select
                    value={listing.subcategory}
                    onChange={(e) => setListing({...listing, subcategory: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!listing.category}
                  >
                    <option value="">Select Subcategory</option>
                    {listing.category && (platform === 'ebay' ? ebayCategories : vintedCategories)[listing.category]?.map(subcat => (
                      <option key={subcat} value={subcat}>{subcat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Brand and Size */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand *
                  </label>
                  <input
                    type="text"
                    value={listing.brand}
                    onChange={(e) => setListing({...listing, brand: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Nike"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size
                  </label>
                  <input
                    type="text"
                    value={listing.size}
                    onChange={(e) => setListing({...listing, size: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., M, 10, 32/34"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size Type
                  </label>
                  <select
                    value={listing.sizeType}
                    onChange={(e) => setListing({...listing, sizeType: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Petite">Petite</option>
                    <option value="Plus">Plus</option>
                    <option value="Tall">Tall</option>
                    <option value="Maternity">Maternity</option>
                  </select>
                </div>
              </div>

              {/* Condition and Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition *
                  </label>
                  <select
                    value={listing.condition}
                    onChange={(e) => setListing({...listing, condition: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {conditions.map(cond => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (£) *
                  </label>
                  <input
                    type="number"
                    value={listing.price}
                    onChange={(e) => setListing({...listing, price: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    value={listing.color}
                    onChange={(e) => setListing({...listing, color: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material
                  </label>
                  <input
                    type="text"
                    value={listing.material}
                    onChange={(e) => setListing({...listing, material: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Cotton"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Style
                  </label>
                  <input
                    type="text"
                    value={listing.style}
                    onChange={(e) => setListing({...listing, style: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Casual"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={listing.description}
                  onChange={(e) => setListing({...listing, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="Describe the item in detail..."
                />
              </div>

              {/* eBay Business Policies */}
              {platform === 'ebay' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Business Policies</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shipping Policy
                      </label>
                      <select
                        value={listing.shippingPolicy}
                        onChange={(e) => setListing({...listing, shippingPolicy: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Policy</option>
                        <option value="standard">Standard Shipping</option>
                        <option value="free">Free Shipping</option>
                        <option value="express">Express Shipping</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Policy
                      </label>
                      <select
                        value={listing.paymentPolicy}
                        onChange={(e) => setListing({...listing, paymentPolicy: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Policy</option>
                        <option value="immediate">Immediate Payment</option>
                        <option value="standard">Standard Payment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Return Policy
                      </label>
                      <select
                        value={listing.returnPolicy}
                        onChange={(e) => setListing({...listing, returnPolicy: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Policy</option>
                        <option value="30days">30 Day Returns</option>
                        <option value="14days">14 Day Returns</option>
                        <option value="noreturns">No Returns</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <button
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Save as Draft
                </button>
                
                <button
                  onClick={() => handleSave(false)}
                  disabled={isSaving || !listing.title || !listing.brand || !listing.price}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSaving ? 'Saving...' : `List on ${platform === 'ebay' ? 'eBay' : 'Vinted'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}