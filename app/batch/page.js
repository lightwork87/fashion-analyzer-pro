'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Navigation from '../components/Navigation';
import { useUserData } from '../hooks/useUserData';

export default function BatchUploadPage() {
  const { userId } = useAuth();
  const { user, loading } = useUserData();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [groupedItems, setGroupedItems] = useState([]);
  const [processingStatus, setProcessingStatus] = useState('');

  // Move function inside component to avoid serialization issues
  const compressImage = async (file) => {
    if (!file || !(file instanceof File)) {
      console.error('Invalid file object:', file);
      return null;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(error);
      };
      
      reader.onload = (event) => {
        if (!event?.target?.result) {
          reject(new Error('No file data'));
          return;
        }
        
        const img = new Image();
        
        img.onerror = () => {
          reject(new Error('Image load failed'));
        };
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Canvas context failed'));
              return;
            }
            
            let width = img.width;
            let height = img.height;
            const maxSize = 600;
            
            if (width > height && width > maxSize) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else if (height > maxSize) {
              width = (width / height) * maxSize;
              height = maxSize;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Blob creation failed'));
                return;
              }
              
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              
              resolve({
                blob: blob,
                preview: canvas.toDataURL('image/jpeg', 0.6),
                file: compressedFile,
                name: file.name,
                originalFile: file,
                size: blob.size
              });
            }, 'image/jpeg', 0.6);
            
          } catch (canvasError) {
            console.error('Canvas processing error:', canvasError);
            reject(canvasError);
          }
        };
        
        img.src = event.target.result;
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.length > 600) {
      setError('Maximum 600 images allowed');
      return;
    }

    console.log(`Selected ${files.length} files for batch processing`);
    setError(null);
    setIsProcessing(true);
    setProcessingStatus('Processing images...');

    try {
      const processedImages = [];
      const batchSize = 5;
      
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        setProcessingStatus(`Processing images ${i + 1}-${Math.min(i + batchSize, files.length)} of ${files.length}...`);
        
        const batchPromises = batch.map(file => {
          return compressImage(file).catch(err => {
            console.error(`Failed to process ${file.name}:`, err);
            return null;
          });
        });
        
        const batchResults = await Promise.all(batchPromises);
        processedImages.push(...batchResults.filter(img => img !== null));
        
        setUploadedImages([...processedImages]);
      }
      
      console.log(`Successfully processed ${processedImages.length} images`);
      const totalSize = processedImages.reduce((sum, img) => sum + img.size, 0);
      console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      
      setUploadedImages(processedImages);
      setProcessingStatus('');
    } catch (error) {
      console.error('Error processing images:', error);
      setError('Failed to process some images. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const groupImagesByAI = async () => {
    if (uploadedImages.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setProcessingStatus('Creating thumbnails for AI grouping...');

    try {
      const thumbnails = await Promise.all(
        uploadedImages.map(async (img, index) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const image = new Image();
          
          await new Promise((resolve) => {
            image.onload = resolve;
            image.src = img.preview;
          });
          
          canvas.width = 100;
          canvas.height = 100;
          ctx.drawImage(image, 0, 0, 100, 100);
          
          return {
            index,
            thumbnail: canvas.toDataURL('image/jpeg', 0.3),
            name: img.name
          };
        })
      );

      setProcessingStatus('Sending to AI for grouping...');

      const response = await fetch('/api/batch/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          images: thumbnails,
          totalImages: uploadedImages.length 
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server error: ${text.substring(0, 100)}...`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to group images');
      }

      const data = await response.json();
      console.log('AI grouped images into', data.groups.length, 'items');

      const groupedData = data.groups.map((group, groupIndex) => ({
        id: `group_${groupIndex}`,
        images: group.indices.map(idx => uploadedImages[idx]),
        suggestedName: group.suggestedName || `Item ${groupIndex + 1}`
      }));

      setGroupedItems(groupedData);
      sessionStorage.setItem('batchImageCount', uploadedImages.length.toString());
      
    } catch (error) {
      console.error('Error grouping images:', error);
      setError(error.message || 'Failed to group images. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const proceedToResults = () => {
    if (groupedItems.length === 0) return;
    
    if (typeof window !== 'undefined') {
      window.batchGroupedItems = groupedItems;
    }
    
    router.push('/batch/results');
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setGroupedItems([]);
  };

  const removeGroup = (groupId) => {
    setGroupedItems(prev => prev.filter(group => group.id !== groupId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Batch Upload</h1>
          <p className="mt-1 text-sm text-gray-600">
            Upload up to 600 photos (25 items × 24 photos each). AI will automatically group them into items.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isProcessing}
            />
            
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            
            <p className="mt-2 text-sm text-gray-600">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="font-medium text-blue-600 hover:text-blue-500"
                disabled={isProcessing}
              >
                Click to upload
              </button>
              {' '}or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF up to 10MB each
            </p>
          </div>

          {processingStatus && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded">
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {processingStatus}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>

        {uploadedImages.length > 0 && groupedItems.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Uploaded Images ({uploadedImages.length})
              </h3>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Total size: {(uploadedImages.reduce((sum, img) => sum + img.size, 0) / 1024 / 1024).toFixed(2)} MB
                </span>
                <button
                  onClick={() => {
                    setUploadedImages([]);
                    setGroupedItems([]);
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 mb-6 max-h-96 overflow-y-auto">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image.preview}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-20 object-cover rounded"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isProcessing}
              >
                Add More Images
              </button>
              <button
                onClick={groupImagesByAI}
                disabled={isProcessing || !user}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isProcessing ? 'Processing...' : 'Group Images by AI'}
              </button>
            </div>
          </div>
        )}

        {groupedItems.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  AI Grouped {groupedItems.length} Items
                </h3>
                <button
                  onClick={proceedToResults}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Proceed to Analysis ({groupedItems.length} credits)
                </button>
              </div>
              
              <div className="space-y-4">
                {groupedItems.map((group) => (
                  <div key={group.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{group.suggestedName}</h4>
                      <button
                        onClick={() => removeGroup(group.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-6 md:grid-cols-8 gap-2">
                      {group.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img.preview}
                          alt={`${group.suggestedName} - ${idx + 1}`}
                          className="w-full h-16 object-cover rounded"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {group.images.length} photos
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}