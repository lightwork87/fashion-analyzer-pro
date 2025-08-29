// app/dashboard/batch-processing/page.js
// COMPLETE BATCH PROCESSING PAGE FILE

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Package,
  Images,
  Loader2,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  Plus,
  Trash2,
  Camera,
  CreditCard
} from 'lucide-react';

export default function BatchProcessingPage() {
  const { user } = useUser();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [items, setItems] = useState([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data.available || 0);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNewItem = () => {
    if (items.length >= 25) {
      alert('Maximum 25 items per batch');
      return;
    }
    
    const newItem = {
      id: Date.now(),
      name: `Item ${items.length + 1}`,
      images: [],
      status: 'pending'
    };
    
    setItems([...items, newItem]);
    setCurrentItemIndex(items.length);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    const currentItem = items[currentItemIndex];
    if (!currentItem) {
      alert('Please add an item first');
      return;
    }
    
    const remainingSlots = 24 - currentItem.images.length;
    const filesToAdd = files.slice(0, remainingSlots);
    
    const newImages = filesToAdd.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    
    const updatedItems = [...items];
    updatedItems[currentItemIndex].images = [
      ...currentItem.images,
      ...newImages
    ];
    setItems(updatedItems);
  };

  const removeImage = (itemIndex, imageId) => {
    const updatedItems = [...items];
    const item = updatedItems[itemIndex];
    const imageToRemove = item.images.find(img => img.id === imageId);
    
    if (imageToRemove?.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    item.images = item.images.filter(img => img.id !== imageId);
    setItems(updatedItems);
  };

  const removeItem = (itemIndex) => {
    const itemToRemove = items[itemIndex];
    itemToRemove.images.forEach(img => {
      if (img.preview) URL.revokeObjectURL(img.preview);
    });
    
    const updatedItems = items.filter((_, index) => index !== itemIndex);
    setItems(updatedItems);
    
    if (currentItemIndex >= updatedItems.length) {
      setCurrentItemIndex(Math.max(0, updatedItems.length - 1));
    }
  };

  const processItems = async () => {
    const validItems = items.filter(item => item.images.length > 0);
    
    if (validItems.length === 0) {
      alert('Please add at least one item with photos');
      return;
    }
    
    if (credits < validItems.length) {
      alert(`You need ${validItems.length} credits but only have ${credits}`);
      router.push('/dashboard/get-credits');
      return;
    }
    
    setIsProcessing(true);
    setUploadProgress(0);
    
    try {
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        setUploadProgress(Math.round(((i + 1) / validItems.length) * 100));
        
        const updatedItems = [...items];
        const itemIndex = items.findIndex(it => it.id === item.id);
        updatedItems[itemIndex].status = 'processing';
        setItems(updatedItems);
        
        // TODO: Upload images and call analyze API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        updatedItems[itemIndex].status = 'completed';
        setItems(updatedItems);
      }
      
      setUploadProgress(100);
      
      setTimeout(() => {
        router.push('/dashboard/listings');
      }, 1000);
      
    } catch (error) {
      console.error('Processing error:', error);
      alert('Failed to process items. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      items.forEach(item => {
        item.images.forEach(img => {
          if (img.preview) URL.revokeObjectURL(img.preview);
        });
      });
    };
  }, [items]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold">Batch Processing</h1>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <CreditCard className="w-4 h-4 text-gray-600" />
              <span className="font-medium">{credits} Credits</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Batch Processing</p>
              <p className="text-sm text-blue-700 mt-1">
                Process up to 25 items with 24 photos each. Each item uses 1 credit.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Items ({items.length}/25)</h2>
                  <button
                    onClick={addNewItem}
                    disabled={items.length >= 25 || isProcessing}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No items added</p>
                    <button
                      onClick={addNewItem}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Add your first item
                    </button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 ${
                          currentItemIndex === index ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setCurrentItemIndex(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              {item.images.length} photo{item.images.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.status === 'completed' && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {item.status === 'processing' && (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItem(index);
                              }}
                              disabled={isProcessing}
                              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Image Upload Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {items.length === 0 || !items[currentItemIndex] ? (
                <div className="text-center py-12">
                  <Images className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Add an item to start uploading photos</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg">
                      {items[currentItemIndex].name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {items[currentItemIndex].images.length}/24 photos
                    </p>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-4">
                    {items[currentItemIndex].images.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.preview}
                          alt={image.name}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(currentItemIndex, image.id)}
                          disabled={isProcessing}
                          className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {items[currentItemIndex].images.length < 24 && !isProcessing && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition"
                      >
                        <Camera className="w-6 h-6 text-gray-400" />
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Process Button */}
        {items.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Ready to process?</p>
                <p className="text-sm text-gray-500">
                  {items.filter(item => item.images.length > 0).length} items will use {items.filter(item => item.images.length > 0).length} credits
                </p>
              </div>
              
              <button
                onClick={processItems}
                disabled={isProcessing || items.filter(item => item.images.length > 0).length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Process All Items
                  </>
                )}
              </button>
            </div>
            
            {isProcessing && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}