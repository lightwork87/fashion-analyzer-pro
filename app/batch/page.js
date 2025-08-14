'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useUserData } from '../hooks/useUserData';
import Image from 'next/image';
import Link from 'next/link';

export default function BatchProcessing() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { user, loading: userLoading } = useUserData();
  const fileInputRef = useRef(null);
  
  const [images, setImages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isGrouping, setIsGrouping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState(null);

  const MAX_IMAGES = 600; // 25 items × 24 photos
  const MAX_ITEMS = 25;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed. You selected ${files.length}.`);
      return;
    }

    setError(null);
    
    // Convert files to preview URLs
    const newImages = files.map((file, index) => ({
      id: `img-${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    setImages(newImages);
  };

  const handleGroupImages = async () => {
    if (images.length === 0) return;

    setIsGrouping(true);
    setError(null);

    try {
      // Create FormData with all images
      const formData = new FormData();
      images.forEach((img, index) => {
        formData.append('images', img.file);
      });

      // Call AI to group images
      const response = await fetch('/api/batch/group-images', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to group images');
      }

      const data = await response.json();
      
      // Format groups with proper image data
      const formattedGroups = data.groups.map((group, index) => ({
        id: `group-${Date.now()}-${index}`,
        groupNumber: index + 1,
        images: group.images.map(imgIndex => images[imgIndex]),
        confidence: group.confidence || 0.9
      }));

      setGroups(formattedGroups);
    } catch (error) {
      console.error('Grouping error:', error);
      setError('Failed to group images. Please try again.');
    } finally {
      setIsGrouping(false);
    }
  };

  const handleProcessAllGroups = async () => {
    if (!user || groups.length === 0) return;

    const creditsNeeded = groups.length;
    const totalCredits = (user.credits_total || 0) + (user.bonus_credits || 0);
    const creditsRemaining = totalCredits - (user.credits_used || 0);

    if (creditsRemaining < creditsNeeded) {
      setError(`Not enough credits. You need ${creditsNeeded} credits but only have ${creditsRemaining}.`);
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    const results = [];

    try {
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        setProcessingProgress(Math.round(((i + 1) / groups.length) * 100));

        // Create FormData for this group
        const formData = new FormData();
        
        // Add images for this group
        for (const img of group.images) {
          formData.append('images', img.file);
        }

        formData.append('userId', clerkUser.id);
        formData.append('batchMode', 'true');
        formData.append('groupNumber', group.groupNumber.toString());

        try {
          const response = await fetch('/api/analyze-ai', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error(`Failed to analyze group ${group.groupNumber}`);
          }

          const analysisResult = await response.json();
          
          // Format the result with all necessary data
          results.push({
            id: group.id,
            groupNumber: group.groupNumber,
            images: group.images.map(img => ({
              preview: img.preview,
              url: img.preview, // For compatibility
              name: img.name
            })),
            analysis: analysisResult,
            status: 'success'
          });

        } catch (groupError) {
          console.error(`Error processing group ${group.groupNumber}:`, groupError);
          results.push({
            id: group.id,
            groupNumber: group.groupNumber,
            images: group.images.map(img => ({
              preview: img.preview,
              url: img.preview,
              name: img.name
            })),
            analysis: {
              error: groupError.message,
              title: `Item ${group.groupNumber} - Failed`,
              brand: 'Unknown',
              price: '0'
            },
            status: 'failed'
          });
        }
      }

      // Store results in sessionStorage before navigation
      sessionStorage.setItem('batchResults', JSON.stringify(results));
      
      // Navigate to results page
      router.push('/batch/results');

    } catch (error) {
      console.error('Batch processing error:', error);
      setError('Failed to process items. Please try again.');
      setIsProcessing(false);
    }
  };

  const removeGroup = (groupId) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const removeImageFromGroup = (groupId, imageId) => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          images: group.images.filter(img => img.id !== imageId)
        };
      }
      return group;
    }).filter(g => g.images.length > 0));
  };

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Batch Processing (Beta)</h1>
          <p className="text-gray-600">Upload up to {MAX_IMAGES} photos for {MAX_ITEMS} items. AI will group them automatically.</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* File Upload Section */}
        {images.length === 0 && !isGrouping && !isProcessing && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="text-center">
              <div className="mb-6">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="batch-file-input"
              />
              <label
                htmlFor="batch-file-input"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                Select Images
              </label>
              <p className="mt-2 text-sm text-gray-500">
                Select all images at once (up to {MAX_IMAGES} total)
              </p>
            </div>
          </div>
        )}

        {/* Selected Images Preview */}
        {images.length > 0 && groups.length === 0 && !isGrouping && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {images.length} images selected
            </h2>
            <div className="grid grid-cols-6 gap-4 mb-6">
              {images.slice(0, 18).map((img) => (
                <div key={img.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={img.preview}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {images.length > 18 && (
                <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    +{images.length - 18} more
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleGroupImages}
              disabled={isGrouping}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isGrouping ? 'AI is grouping images...' : 'Group Images by Item'}
            </button>
          </div>
        )}

        {/* Grouped Items */}
        {groups.length > 0 && !isProcessing && (
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                AI grouped your images into {groups.length} items
              </h2>
              <p className="text-gray-600 mb-4">
                Review the groups below. You can remove images or entire groups if needed.
              </p>
              <button
                onClick={handleProcessAllGroups}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
              >
                Process All {groups.length} Items ({groups.length} credits)
              </button>
            </div>

            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium">
                      Item {group.groupNumber} ({group.images.length} photos)
                    </h3>
                    <button
                      onClick={() => removeGroup(group.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove Group
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-3">
                    {group.images.map((img) => (
                      <div key={img.id} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={img.preview}
                            alt={img.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removeImageFromGroup(group.id, img.id)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Progress */}
        {isProcessing && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold mb-4">Processing Items...</h2>
            <div className="mb-4">
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
            <p className="text-center text-gray-600">
              Processing item {Math.ceil((processingProgress / 100) * groups.length)} of {groups.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}