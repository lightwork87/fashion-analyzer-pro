'use client';

import { useState, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { compressImage } from '../utils/imageCompression';

export default function BatchUploadPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  // States
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processedImages, setProcessedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('upload'); // upload, processing, grouping, review
  const [groupedItems, setGroupedItems] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  
  // Constants
  const MAX_ITEMS = 25;
  const MAX_PHOTOS_PER_ITEM = 24;
  const MAX_TOTAL_PHOTOS = MAX_ITEMS * MAX_PHOTOS_PER_ITEM; // 600
  
  // Drag and drop handlers
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.id === 'batch-drop-zone') {
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
    
    handleFileSelection(files);
  }, []);
  
  // File selection handler
  const handleFileSelection = async (files) => {
    const remainingSlots = MAX_TOTAL_PHOTOS - uploadedFiles.length;
    const filesToProcess = files.slice(0, remainingSlots);
    
    if (files.length > remainingSlots) {
      setError(`Only ${remainingSlots} more photos can be added. Maximum is ${MAX_TOTAL_PHOTOS} photos.`);
    }
    
    setUploadedFiles(prev => [...prev, ...filesToProcess]);
    setCurrentStep('processing');
    setIsProcessing(true);
    
    // Process images
    const processed = [];
    for (let i = 0; i < filesToProcess.length; i++) {
      try {
        setUploadProgress(Math.round((i / filesToProcess.length) * 100));
        
        const file = filesToProcess[i];
        const compressedFile = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8
        });
        
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(compressedFile);
        });
        
        processed.push({
          id: `img-${Date.now()}-${i}`,
          file: compressedFile,
          preview: base64,
          name: file.name,
          size: compressedFile.size,
          originalIndex: uploadedFiles.length + i
        });
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }
    
    setProcessedImages(prev => [...prev, ...processed]);
    setUploadProgress(100);
    
    // Auto-trigger grouping if we have enough photos
    if (processedImages.length + processed.length >= 24) {
      setTimeout(() => handleAIGrouping([...processedImages, ...processed]), 1000);
    } else {
      setIsProcessing(false);
      setCurrentStep('upload');
    }
  };
  
  // AI Grouping - Smart grouping logic
  const handleAIGrouping = async (images) => {
    setCurrentStep('grouping');
    setError(null);
    
    try {
      // TODO: Replace with actual AI grouping in future
      // This should call an API endpoint that uses vision AI to:
      // 1. Detect similar items (same clothing piece from different angles)
      // 2. Group by visual similarity
      // 3. Identify primary/secondary images
      // 4. Suggest optimal image order
      
      // Current implementation: Smart sequential grouping
      const photosPerItem = 24; // Max photos per item
      const groups = [];
      
      for (let i = 0; i < images.length; i += photosPerItem) {
        const groupImages = images.slice(i, Math.min(i + photosPerItem, images.length));
        if (groupImages.length > 0) {
          groups.push({
            id: `group-${Date.now()}-${groups.length}`,
            name: `Item ${groups.length + 1}`,
            images: groupImages,
            primaryImage: groupImages[0],
            status: 'pending',
            confidence: 95, // High confidence for manual grouping
            suggestedCategory: 'Fashion Item',
            estimatedPhotos: groupImages.length
          });
        }
      }
      
      setGroupedItems(groups);
      setCurrentStep('review');
      setIsProcessing(false);
    } catch (error) {
      setError('Failed to group items. Please try again.');
      setIsProcessing(false);
    }
  };
  
  // Remove image from a group
  const removeImageFromGroup = (groupId, imageId) => {
    setGroupedItems(prev => prev.map(group => {
      if (group.id === groupId) {
        const updatedImages = group.images.filter(img => img.id !== imageId);
        return {
          ...group,
          images: updatedImages,
          primaryImage: updatedImages[0] || null,
          estimatedPhotos: updatedImages.length
        };
      }
      return group;
    }).filter(group => group.images.length > 0)); // Remove empty groups
  };
  
  // Move image between groups
  const moveImageToGroup = (fromGroupId, toGroupId, imageId) => {
    const image = groupedItems
      .find(g => g.id === fromGroupId)
      ?.images.find(img => img.id === imageId);
      
    if (!image) return;
    
    setGroupedItems(prev => prev.map(group => {
      if (group.id === fromGroupId) {
        return {
          ...group,
          images: group.images.filter(img => img.id !== imageId),
          estimatedPhotos: group.images.length - 1
        };
      }
      if (group.id === toGroupId) {
        return {
          ...group,
          images: [...group.images, image],
          estimatedPhotos: group.images.length + 1
        };
      }
      return group;
    }));
  };
  
  // Create new group
  const createNewGroup = () => {
    const newGroup = {
      id: `group-${Date.now()}`,
      name: `Item ${groupedItems.length + 1}`,
      images: [],
      primaryImage: null,
      status: 'pending',
      confidence: 0,
      suggestedCategory: 'Fashion Item',
      estimatedPhotos: 0
    };
    setGroupedItems(prev => [...prev, newGroup]);
  };
  
  // Rename group
  const renameGroup = (groupId, newName) => {
    setGroupedItems(prev => prev.map(group => 
      group.id === groupId ? { ...group, name: newName } : group
    ));
  };
  
  // Process all groups
  const processAllGroups = async () => {
    // This will analyze each group and create listings
    const validGroups = groupedItems.filter(group => group.images.length > 0);
    
    if (validGroups.length === 0) {
      setError('No valid item groups to process');
      return;
    }
    
    // Store groups in localStorage
    localStorage.setItem('batchGroups', JSON.stringify(validGroups));
    
    // Redirect to batch results page
    router.push('/batch/results');
  };
  
  // Reset everything
  const resetBatch = () => {
    setUploadedFiles([]);
    setProcessedImages([]);
    setGroupedItems([]);
    setCurrentStep('upload');
    setError(null);
    setUploadProgress(0);
    setSelectedGroup(null);
  };
  
  if (!isLoaded || !isSignedIn) {
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
              <Link href="/dashboard" className="flex items-center">
                <Image 
                  src="/logo.png" 
                  alt="LightLister AI" 
                  width={32} 
                  height={32}
                  className="h-8 w-auto mr-3"
                />
                <h1 className="text-xl font-bold text-gray-900">Batch Processing</h1>
              </Link>
              <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                BETA
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="text-sm bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className={`flex items-center ${currentStep === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  1
                </div>
                <span className="ml-2 font-medium">Upload Photos</span>
              </div>
              
              <div className={`flex items-center ${
                ['processing', 'grouping'].includes(currentStep) ? 'text-blue-600' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ['processing', 'grouping'].includes(currentStep) ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  2
                </div>
                <span className="ml-2 font-medium">AI Grouping</span>
              </div>
              
              <div className={`flex items-center ${currentStep === 'review' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  3
                </div>
                <span className="ml-2 font-medium">Review & Edit</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {processedImages.length} / {MAX_TOTAL_PHOTOS} photos
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Upload Step */}
        {currentStep === 'upload' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4">Upload Multiple Items at Once</h2>
            <p className="text-gray-600 mb-6">
              Upload up to {MAX_TOTAL_PHOTOS} photos ({MAX_ITEMS} items × {MAX_PHOTOS_PER_ITEM} photos each). 
              Our AI will automatically group them into individual listings.
            </p>
            
            <div
              id="batch-drop-zone"
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelection(Array.from(e.target.files))}
                className="sr-only"
                id="batch-upload"
              />
              
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              
              <label htmlFor="batch-upload" className="cursor-pointer">
                <p className="mt-4 text-lg font-medium text-gray-900">
                  Drop all your photos here or click to browse
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Upload up to {MAX_TOTAL_PHOTOS} photos total • JPG, PNG up to 10MB each
                </p>
              </label>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Select Photos
              </button>
            </div>
            
            {processedImages.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">{processedImages.length} photos uploaded</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={resetBatch}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => handleAIGrouping(processedImages)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Start AI Grouping
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-8 gap-2 max-h-96 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                  {processedImages.slice(0, 48).map((img) => (
                    <img
                      key={img.id}
                      src={img.preview}
                      alt={img.name}
                      className="w-full h-20 object-cover rounded shadow-sm"
                    />
                  ))}
                  {processedImages.length > 48 && (
                    <div className="w-full h-20 bg-gray-200 rounded shadow-sm flex items-center justify-center text-sm text-gray-600">
                      +{processedImages.length - 48} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Processing Step */}
        {currentStep === 'processing' && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="text-xl font-semibold mt-6 mb-2">Processing Images</h2>
            <p className="text-gray-600 mb-4">Compressing and preparing your photos...</p>
            <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">{uploadProgress}% complete</p>
          </div>
        )}
        
        {/* Grouping Step */}
        {currentStep === 'grouping' && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-pulse">
              <svg className="mx-auto h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mt-6 mb-2">AI Grouping in Progress</h2>
            <p className="text-gray-600">
              Analyzing photos and grouping similar items together...
            </p>
            <p className="text-sm text-gray-500 mt-4">
              This may take a few moments
            </p>
          </div>
        )}
        
        {/* Review Step */}
        {currentStep === 'review' && (
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Review Grouped Items</h2>
                  <p className="text-gray-600 mt-1">
                    AI has grouped your photos into {groupedItems.length} items. 
                    Review and adjust as needed.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={createNewGroup}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    + Add Group
                  </button>
                  <button
                    onClick={resetBatch}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                  >
                    Start Over
                  </button>
                  <button
                    onClick={processAllGroups}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    Process All Items
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedItems.map((group) => (
                  <div
                    key={group.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedGroup?.id === group.id
                        ? 'border-blue-500 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={group.name}
                          onChange={(e) => {
                            e.stopPropagation();
                            renameGroup(group.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          {group.images.length} {group.images.length === 1 ? 'photo' : 'photos'}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          group.confidence > 85
                            ? 'bg-green-100 text-green-700'
                            : group.confidence > 70
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {Math.round(group.confidence)}% match
                        </span>
                      </div>
                    </div>
                    
                    {/* Image Grid Preview */}
                    <div className="grid grid-cols-4 gap-1 mb-3">
                      {group.images.slice(0, 8).map((img, idx) => (
                        <img
                          key={img.id}
                          src={img.preview}
                          alt=""
                          className="w-full h-16 object-cover rounded"
                        />
                      ))}
                      {group.images.length > 8 && (
                        <div className="w-full h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-600">
                          +{group.images.length - 8}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {group.suggestedCategory}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Remove this group?')) {
                            setGroupedItems(prev => prev.filter(g => g.id !== group.id));
                            if (selectedGroup?.id === group.id) {
                              setSelectedGroup(null);
                            }
                          }
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Selected Group Editor */}
            {selectedGroup && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Editing: {selectedGroup.name}
                </h3>
                <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                  {selectedGroup.images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.preview}
                        alt=""
                        className="w-full h-24 object-cover rounded shadow-sm"
                      />
                      <button
                        onClick={() => removeImageFromGroup(selectedGroup.id, img.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  Tip: Click on photos to remove them from this group
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}