'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Upload, 
  Loader2, 
  AlertCircle, 
  Info,
  Crown,
  Sparkles
} from 'lucide-react';
import { uploadImage } from '../../lib/storage';

export default function BatchAnalysisPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [items, setItems] = useState([]);
  const [credits, setCredits] = useState({ available: 0, total: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const grantStarterCredits = async () => {
    try {
      const response = await fetch('/api/user/grant-credits', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setCredits(prev => ({ ...prev, available: data.total_credits }));
        setError(null);
      }
      
      alert(data.message);
    } catch (error) {
      console.error('Error granting credits:', error);
      alert('Failed to grant credits. Please try again.');
    }
  };

  const addItem = () => {
    if (items.length >= 25) {
      setError('Maximum 25 items allowed in batch processing');
      return;
    }
    
    const newItem = {
      id: Date.now() + Math.random(),
      name: `Item ${items.length + 1}`,
      images: [],
      status: 'pending'
    };
    
    setItems([...items, newItem]);
    setError(null);
  };

  const removeItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleImageUpload = (itemId, files) => {
    if (!files.length) return;
    
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    const newImages = Array.from(files).slice(0, 24 - item.images.length).map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    
    setItems(items.map(i => 
      i.id === itemId 
        ? { ...i, images: [...i.images, ...newImages] }
        : i
    ));
  };

  const removeImage = (itemId, imageId) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    const image = item.images.find(img => img.id === imageId);
    if (image?.preview) {
      URL.revokeObjectURL(image.preview);
    }
    
    setItems(items.map(i => 
      i.id === itemId 
        ? { ...i, images: i.images.filter(img => img.id !== imageId) }
        : i
    ));
  };

  const analyzeSelectedItems = async () => {
    const selectedItems = items.filter(item => item.images.length > 0);
    
    if (selectedItems.length === 0) {
      setError('Please add images to at least one item');
      return;
    }
    
    if (credits.available < selectedItems.length) {
      setError(`Insufficient credits. You need ${selectedItems.length} credits but only have ${credits.available}.`);
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const results = [];
      
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        
        // Update item status
        setItems(prev => prev.map(it => 
          it.id === item.id 
            ? { ...it, status: 'analyzing' }
            : it
        ));
        
        // Upload images
        const uploadedUrls = [];
        for (const image of item.images) {
          const url = await uploadImage(image.file, userId);
          uploadedUrls.push(url);
        }
        
        // Call AI analysis
        const response = await fetch('/api/analyze-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrls: uploadedUrls })
        });
        
        const data = await response.json();
        
        if (data.success) {
          results.push(data.analysis);
          setItems(prev => prev.map(it => 
            it.id === item.id 
              ? { ...it, status: 'completed', analysis: data.analysis }
              : it
          ));
        } else {
          setItems(prev => prev.map(it => 
            it.id === item.id 
              ? { ...it, status: 'failed', error: data.error }
              : it
          ));
        }
      }
      
      // Navigate to batch results
      sessionStorage.setItem('batchResults', JSON.stringify(results));
      router.push('/dashboard/batch-results');
      
    } catch (error) {
      console.error('Batch analysis error:', error);
      setError('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Sparkles className="w-8 h-8 text-purple-600" />
                <h1 className="text-3xl font-bold text-gray-900">Batch Analysis</h1>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center space-x-1">
                  <Crown className="w-4 h-4" />
                  <span>Pro Feature</span>
                </span>
              </div>
              <p className="text-gray-600">Process up to 25 items with 24 photos each</p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600">Credits Available</p>
              <p className="text-2xl font-bold text-blue-600">{credits.available}</p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Batch Processing Mode</p>
              <p>Process up to 25 items in one batch. Each item can have up to 24 photos. Perfect for bulk listing creation. 1 credit per item analyzed.</p>
            </div>
          </div>
        </div>

        {/* Credits Warning */}
        {credits.available === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold">Insufficient credits</p>
                  <p>You need at least 1 credit to analyze items. Get starter credits to begin.</p>
                </div>
              </div>
              <button
                onClick={grantStarterCredits}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Get Free Credits
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Add Item Button */}
        <div className="mb-6">
          <button
            onClick={addItem}
            disabled={items.length >= 25 || isAnalyzing}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            <span>Add Item</span>
          </button>
          <p className="text-sm text-gray-500 mt-1">
            {items.length} / 25 items
          </p>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={isAnalyzing}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Image Upload Area */}
              <div className="mb-3">
                {item.images.length === 0 ? (
                  <div
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = 'image/*';
                      input.onchange = (e) => handleImageUpload(item.id, e.target.files);
                      input.click();
                    }}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Upload photos</p>
                    <p className="text-xs text-gray-500">Up to 24 images</p>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {item.images.slice(0, 6).map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.preview}
                            alt={image.name}
                            className="w-full h-16 object-cover rounded"
                          />
                          <button
                            onClick={() => removeImage(item.id, image.id)}
                            disabled={isAnalyzing}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.images.length} photos</span>
                      {item.images.length < 24 && (
                        <button
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.accept = 'image/*';
                            input.onchange = (e) => handleImageUpload(item.id, e.target.files);
                            input.click();
                          }}
                          disabled={isAnalyzing}
                          className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
                        >
                          Add more
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.status === 'completed' ? 'bg-green-100 text-green-700' :
                  item.status === 'analyzing' ? 'bg-blue-100 text-blue-700' :
                  item.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {item.status === 'analyzing' && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
                  {item.status}
                </span>
                
                {item.analysis && (
                  <span className="text-xs text-green-600 font-medium">
                    £{item.analysis.suggested_price}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Analyze Button */}
        {items.some(item => item.images.length > 0) && (
          <div className="flex justify-center">
            <button
              onClick={analyzeSelectedItems}
              disabled={isAnalyzing || credits.available === 0}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-lg font-medium"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing Items...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Analyze {items.filter(i => i.images.length > 0).length} Selected</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}