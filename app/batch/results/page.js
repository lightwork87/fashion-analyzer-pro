'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useUserData } from '../../hooks/useUserData';

function BatchResultsContent() {
  const router = useRouter();
  const { user, refreshUser } = useUserData();
  
  const [groups, setGroups] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    // Get grouped items from window object or navigation state
    if (typeof window !== 'undefined' && window.batchGroupedItems) {
      setGroups(window.batchGroupedItems);
      // Clean up
      delete window.batchGroupedItems;
    } else {
      // Try to reconstruct from sessionStorage if available
      const groupingInfo = sessionStorage.getItem('batchGroupingInfo');
      if (groupingInfo) {
        setError('Please return to batch upload page to reselect images.');
      } else {
        setError('No grouped items found. Please start from batch upload.');
      }
    }
  }, []);

  const processAllGroups = async () => {
    if (!user || groups.length === 0) return;
    
    setProcessing(true);
    setError(null);
    const newResults = [];

    try {
      for (const [index, group] of groups.entries()) {
        console.log(`Processing group ${index + 1}/${groups.length}`);
        
        // Create FormData with actual files
        const formData = new FormData();
        
        for (const img of group.images) {
          if (img.file) {
            formData.append('images', img.file);
          } else if (img.originalFile) {
            formData.append('images', img.originalFile);
          }
        }
        
        // Add metadata
        formData.append('batchMode', 'true');
        formData.append('groupIndex', index.toString());
        formData.append('suggestedName', group.suggestedName || '');
        
        try {
          const response = await fetch('/api/analyze-ai', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Analysis failed');
          }

          newResults.push({
            groupIndex: index,
            success: true,
            data: data,
            images: group.images.map(img => ({
              preview: img.preview,
              name: img.name
            }))
          });
        } catch (apiError) {
          console.error(`API error for group ${index}:`, apiError);
          newResults.push({
            groupIndex: index,
            error: apiError.message,
            images: group.images.map(img => ({
              preview: img.preview,
              name: img.name
            }))
          });
        }
        
        // Update results after each item
        setResults([...newResults]);
      }
      
      // Refresh user credits
      await refreshUser();
      
      // Clear session storage
      sessionStorage.removeItem('batchGroupingInfo');
      sessionStorage.removeItem('batchImageCount');
      
    } catch (error) {
      console.error('Batch processing error:', error);
      setError('Failed to process batch. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSelectItem = (index) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === results.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(results.map((_, i) => i)));
    }
  };

  const handleBulkListToEbay = async () => {
    const selectedResults = results.filter((_, i) => selectedItems.has(i) && _.success);
    if (selectedResults.length === 0) return;
    
    // TODO: Implement bulk eBay listing
    alert(`Ready to list ${selectedResults.length} items to eBay!`);
  };

  const handleExportToCSV = () => {
    const selectedResults = results.filter((_, i) => selectedItems.has(i) && _.success);
    if (selectedResults.length === 0) return;
    
    // Create CSV content
    const headers = ['Title', 'Brand', 'Size', 'Condition', 'Price', 'Description'];
    const rows = selectedResults.map(r => [
      r.data.title || '',
      r.data.brand || '',
      r.data.size || '',
      r.data.condition || '',
      r.data.price || '',
      (r.data.description || '').replace(/"/g, '""')
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vinted_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Batch Processing Results</h1>
          <p className="mt-1 text-sm text-gray-600">
            Review your grouped items and process them for analysis
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
            <button
              onClick={() => router.push('/batch')}
              className="ml-4 text-sm underline"
            >
              Return to Batch Upload
            </button>
          </div>
        )}

        {/* Process button */}
        {groups.length > 0 && results.length === 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Ready to Process</h3>
            <p className="text-gray-600 mb-4">
              Found {groups.length} items ready for analysis. This will use {groups.length} credits.
            </p>
            <button
              onClick={processAllGroups}
              disabled={processing || !user}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {processing ? `Processing... (${results.length}/${groups.length})` : `Process All Items (${groups.length} credits)`}
            </button>
          </div>
        )}

        {/* Results display remains the same */}
        {results.length > 0 && (
          <div className="space-y-6">
            {/* Bulk actions */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedItems.size === results.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-sm text-gray-600">
                    {selectedItems.size} items selected
                  </span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleExportToCSV}
                    disabled={selectedItems.size === 0}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Export to CSV
                  </button>
                  <button
                    onClick={handleBulkListToEbay}
                    disabled={selectedItems.size === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    List to eBay ({selectedItems.size})
                  </button>
                </div>
              </div>
            </div>

            {/* Individual results */}
            {results.map((result, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(index)}
                    onChange={() => handleSelectItem(index)}
                    className="mt-1"
                  />
                  
                  {result.success ? (
                    <div className="flex-1">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Images */}
                        <div>
                          <h4 className="font-semibold mb-2">Images</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {result.images.slice(0, 6).map((img, imgIndex) => (
                              <img
                                key={imgIndex}
                                src={img.preview}
                                alt={`Item ${index + 1} - Image ${imgIndex + 1}`}
                                className="w-full h-20 object-cover rounded"
                              />
                            ))}
                          </div>
                          {result.images.length > 6 && (
                            <p className="text-sm text-gray-500 mt-1">
                              +{result.images.length - 6} more images
                            </p>
                          )}
                        </div>
                        
                        {/* Analysis results */}
                        <div>
                          <h4 className="font-semibold mb-2">Analysis Results</h4>
                          <div className="space-y-1 text-sm">
                            <p><strong>Title:</strong> {result.data.title}</p>
                            <p><strong>Brand:</strong> {result.data.brand}</p>
                            <p><strong>Size:</strong> {result.data.size}</p>
                            <p><strong>Condition:</strong> {result.data.condition}</p>
                            <p><strong>Price:</strong> £{result.data.price}</p>
                          </div>
                          <button
                            onClick={() => router.push(`/listing/${result.data.id}`)}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                          >
                            View Full Details →
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p className="text-red-600">Error: {result.error}</p>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {result.images?.slice(0, 3).map((img, imgIndex) => (
                          <img
                            key={imgIndex}
                            src={img.preview}
                            alt={`Failed item ${index + 1}`}
                            className="w-full h-20 object-cover rounded opacity-50"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BatchResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BatchResultsContent />
    </Suspense>
  );
}