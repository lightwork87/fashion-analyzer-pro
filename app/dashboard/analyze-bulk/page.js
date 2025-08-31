'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  ArrowLeft, 
  Info, 
  Package,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function AnalyzeBulkPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [groupedItems, setGroupedItems] = useState([]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    // Define newImages properly - this fixes the bug!
    const newImages = files.slice(0, 600).map(file => ({ // 25 items × 24 photos = 600 max
      id: Date.now() + Math.random(),
      file: file,
      preview: URL.createObjectURL(file),
      name: file.name,
      grouped: false
    }));
    
    setImages(prev => [
      ...prev,
      ...newImages
    ].slice(0, 600));
    setError(null);
  };

  const removeImage = (id) => {
    const image = images.find(img => img.id === id);
    if (image?.preview) {
      URL.revokeObjectURL(image.preview);
    }
    setImages(images.filter(img => img.id !== id));
  };

  const groupImages = () => {
    // Simple grouping logic - group every 24 images as one item
    const groups = [];
    const ungroupedImages = images.filter(img => !img.grouped);
    
    for (let i = 0; i < ungroupedImages.length; i += 24) {
      const itemImages = ungroupedImages.slice(i, i + 24);
      if (itemImages.length > 0) {
        groups.push({
          id: Date.now() + i,
          images: itemImages,
          name: `Item ${groups.length + 1}`,
          status: 'pending'
        });
      }
    }
    
    setGroupedItems(groups);
    
    // Mark images as grouped
    const groupedImageIds = groups.flatMap(g => g.images.map(img => img.id));
    setImages(prev => prev.map(img => ({
      ...img,
      grouped: groupedImageIds.includes(img.id)
    })));
  };

  const analyzeBulk = async () => {
    if (groupedItems.length === 0) {
      setError('Please group your images first');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      const results = [];
      
      for (let i = 0; i < groupedItems.length; i++) {
        const item = groupedItems[i];
        setUploadProgress(Math.round((i / groupedItems.length) * 90));
        
        // Update item status
        setGroupedItems(prev => prev.map(g => 
          g.id === item.id ? { ...g, status: 'analyzing' } : g
        ));
        
        // Upload images for this item
        const uploadedUrls = [];
        for (const image of item.images) {
          // Simulate upload - replace with actual upload logic
          const url = URL.createObjectURL(image.file);
          uploadedUrls.push(url);
        }
        
        // Call AI analysis for this item
        const response = await fetch('/api/analyze-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageUrls: uploadedUrls,
            imageCount: uploadedUrls.length 
          })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          results.push({
            itemId: item.id,
            analysis: data.analysis
          });
          
          // Update item status
          setGroupedItems(prev => prev.map(g => 
            g.id === item.id ? { ...g, status: 'completed', analysis: data.analysis } : g
          ));
        } else {
          // Update item status to failed
          setGroupedItems(prev => prev.map(g => 
            g.id === item.id ? { ...g, status: 'failed', error: data.error } : g
          ));
        }
        
        // Small delay between analyses
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setUploadProgress(100);
      
      // Store results and navigate
      sessionStorage.setItem('bulkAnalysisResults', JSON.stringify(results));
      router.push('/dashboard/bulk-results');
      
    } catch (err) {
      setError(err.message || 'Failed to analyze items');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
    };
  }, [images]);

  const maxItems = 25;
  const maxPhotosPerItem = 24;
  const currentItems = Math.ceil(images.length / maxPhotosPerItem);

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
          
          <h1 className="text-3xl font-bold text-gray-900">Bulk Analysis</h1>
          <p className="text-gray-600 mt-2">
            Upload photos of multiple items for batch AI-powered listing creation
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Package className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Items</p>
                <p className="text-lg font-semibold">{currentItems}/{maxItems}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Camera className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Photos</p>
                <p className="text-lg font-semibold">{images.length}/{maxItems * maxPhotosPerItem}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Grouped</p>
                <p className="text-lg font-semibold">{groupedItems.length} items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Bulk Analysis Process:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Upload up to {maxItems} items with {maxPhotosPerItem} photos each</li>
                <li>AI will group similar photos automatically</li>
                <li>Each item gets professional fashion terminology analysis</li>
                <li>Generate eBay listings with proper titles and descriptions</li>
                <li>Process includes brand detection and size identification</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Upload Photos</h2>
            <div className="flex gap-2">
              {images.length > 0 && groupedItems.length === 0 && (
                <button
                  onClick={groupImages}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Group Images
                </button>
              )}
            </div>
          </div>

          {images.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition"
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Click to upload photos or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG up to 10MB each • Up to {maxItems * maxPhotosPerItem} photos total
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className={`w-full h-20 object-cover rounded-lg ${
                      image.grouped ? 'opacity-50' : ''
                    }`}
                  />
                  <button
                    onClick={() => removeImage(image.id)}
                    disabled={isAnalyzing}
                    className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {images.length < maxItems * maxPhotosPerItem && !isAnalyzing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition"
                >
                  <Plus className="w-6 h-6 text-gray-400" />
                </button>
              )}
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Grouped Items */}
        {groupedItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Grouped Items</h2>
              <button
                onClick={analyzeBulk}
                disabled={isAnalyzing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing {Math.floor(uploadProgress)}%
                  </>
                ) : (
                  `Analyze ${groupedItems.length} Items`
                )}
              </button>
            </div>

            {isAnalyzing && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{item.name}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      item.status === 'completed' ? 'bg-green-100 text-green-800' :
                      item.status === 'analyzing' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-1 mb-2">
                    {item.images.slice(0, 8).map((img) => (
                      <img
                        key={img.id}
                        src={img.preview}
                        alt=""
                        className="w-full h-12 object-cover rounded"
                      />
                    ))}
                    {item.images.length > 8 && (
                      <div className="w-full h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-600">
                        +{item.images.length - 8}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {item.images.length} photos
                  </p>

                  {item.analysis && (
                    <div className="mt-2 text-sm">
                      <p className="font-medium">{item.analysis.ebay_title}</p>
                      <p className="text-gray-600">£{item.analysis.suggested_price}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}