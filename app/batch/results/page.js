'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

BatchResults() {
    const router = useRouter();
    const [results, setResults] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingStatus, setProcessingStatus] = useState({
      total: 0,
      successful: 0,
      failed: 0
    });
  
    useEffect(() => {
      // Get results from sessionStorage or state
      const storedResults = sessionStorage.getItem('batchResults');
      if (storedResults) {
        const parsedResults = JSON.parse(storedResults);
        setResults(parsedResults);
        
        // Calculate processing status
        const successful = parsedResults.filter(r => r.status === 'success').length;
        const failed = parsedResults.filter(r => r.status === 'failed').length;
        setProcessingStatus({
          total: parsedResults.length,
          successful,
          failed
        });
      }
      setLoading(false);
    }, []);
  
    const handleSelectAll = () => {
      if (selectedItems.length === results.length) {
        setSelectedItems([]);
      } else {
        setSelectedItems(results.map(r => r.id));
      }
    };
  
    const handleSelectItem = (itemId) => {
      if (selectedItems.includes(itemId)) {
        setSelectedItems(selectedItems.filter(id => id !== itemId));
      } else {
        setSelectedItems([...selectedItems, itemId]);
      }
    };
  
    const handleExportCSV = () => {
      const selectedResults = results.filter(r => selectedItems.includes(r.id));
      
      // Create CSV content
      const headers = ['Title', 'Brand', 'Category', 'Size', 'Condition', 'Price', 'Color', 'Material', 'Description'];
      const csvContent = [
        headers.join(','),
        ...selectedResults.map(item => {
          const a = item.analysis;
          return [
            `"${a.title || ''}"`,
            `"${a.brand || ''}"`,
            `"${a.category || ''}"`,
            `"${a.size || ''}"`,
            `"${a.condition || ''}"`,
            `"${a.price || a.estimated_value_min || ''}"`,
            `"${a.color || ''}"`,
            `"${a.material || ''}"`,
            `"${(a.description || '').replace(/"/g, '""')}"`
          ].join(',');
        })
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `batch_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    };
  
    const handleListToEbay = () => {
      const selectedResults = results.filter(r => selectedItems.includes(r.id));
      sessionStorage.setItem('pendingBulkEbayListings', JSON.stringify(selectedResults));
      router.push('/dashboard?bulk=true');
    };
  
    const viewItemDetails = (item) => {
      // Navigate to detail page with item ID
      router.push(`/batch/item/${item.id}`);
    };
  
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Batch Processing Results</h1>
          <p className="text-gray-600 mb-8">Review your grouped items and process them for analysis</p>

          {/* Action Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {selectedItems.length === results.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-gray-600 text-sm">
                  {selectedItems.length} items selected
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExportCSV}
                  disabled={selectedItems.length === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export to CSV
                </button>
                <button
                  onClick={handleListToEbay}
                  disabled={selectedItems.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  List to eBay ({selectedItems.length})
                </button>
              </div>
            </div>
          </div>

          {/* Processing Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Processing Summary</h2>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Total Items:</p>
                <p className="text-2xl font-bold">{processingStatus.total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Successful:</p>
                <p className="text-2xl font-bold text-green-600">{processingStatus.successful}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Failed:</p>
                <p className="text-2xl font-bold text-red-600">{processingStatus.failed}</p>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="space-y-6">
            {results.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start gap-6">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="mt-1 h-5 w-5 text-blue-600 rounded border-gray-300"
                  />

                  {/* Images Section */}
                  <div className="flex-shrink-0">
                    <h3 className="font-medium mb-3">Images</h3>
                    <div className="grid grid-cols-3 gap-2 w-96">
                      {item.images.slice(0, 6).map((image, idx) => (
                        <div key={idx} className="aspect-square bg-gray-100 rounded overflow-hidden">
                          <img
                            src={image.url || image.preview}
                            alt={`Item ${item.groupNumber} image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    {item.images.length > 6 && (
                      <p className="text-sm text-gray-500 mt-2">
                        +{item.images.length - 6} more images
                      </p>
                    )}
                  </div>

                  {/* Analysis Results */}
                  <div className="flex-grow">
                    <h3 className="font-medium mb-3">Analysis Results</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Title:</span> {item.analysis.title || `Item ${item.groupNumber}`}</p>
                      <p><span className="font-medium">Brand:</span> {item.analysis.brand || 'Unknown Brand'}</p>
                      <p><span className="font-medium">Size:</span> {item.analysis.size || 'One Size'}</p>
                      <p><span className="font-medium">Condition:</span> {item.analysis.condition || 'Good'}</p>
                      <p><span className="font-medium">Price:</span> £{item.analysis.price || item.analysis.estimated_value_min || '20'}</p>
                    </div>
                    <button
                      onClick={() => viewItemDetails(item)}
                      className="mt-4 text-blue-600 hover:underline text-sm"
                    >
                      View Full Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No results to display</p>
              <Link href="/batch" className="text-blue-600 hover:underline mt-2 inline-block">
                Start new batch processing
              </Link>
            </div>
          )}
        </div>
      </div>
    );
}

export default BatchResults;