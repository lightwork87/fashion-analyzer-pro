'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

BatchItemDetail() {
    const params = useParams();
    const router = useRouter();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      // Get batch results from sessionStorage
      const batchResults = sessionStorage.getItem('batchResults');
      if (batchResults) {
        const results = JSON.parse(batchResults);
        const foundItem = results.find(r => r.id === params.id);
        if (foundItem) {
          setItem(foundItem);
        } else {
          // If not found, redirect back to results
          router.push('/batch/results');
        }
      } else {
        // No batch results in storage, redirect
        router.push('/batch/results');
      }
      setLoading(false);
    }, [params.id, router]);
  
    const handleListToEbay = () => {
      // Save to session storage for eBay listing
      sessionStorage.setItem('pendingEbayListing', JSON.stringify(item.analysis));
      router.push('/dashboard');
    };
  
    const handleEdit = () => {
      // Save to session storage for editing
      sessionStorage.setItem('editListing', JSON.stringify(item.analysis));
      router.push('/dashboard');
    };
  
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
  
    if (!item) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Item not found</h2>
            <Link href="/batch/results" className="text-blue-600 hover:underline">
              Back to results
            </Link>
          </div>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Link href="/batch/results" className="text-blue-600 hover:underline mb-4 inline-block">
              ← Back to batch results
            </Link>
            <h1 className="text-3xl font-bold">Item Details</h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* Images Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Images</h2>
                <div className="grid grid-cols-2 gap-4">
                  {item.images.map((image, index) => (
                    <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image.url || image.preview}
                        alt={`Item image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Analysis Results Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Title</label>
                    <p className="text-lg">{item.analysis.title || 'Item ' + item.groupNumber}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Brand</label>
                    <p className="text-lg">{item.analysis.brand || 'Unknown Brand'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <p className="text-lg">{item.analysis.category || 'General'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Size</label>
                      <p className="text-lg">{item.analysis.size || 'One Size'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Condition</label>
                      <p className="text-lg">{item.analysis.condition || 'Good'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Estimated Price</label>
                    <p className="text-2xl font-bold text-green-600">
                      £{item.analysis.price || item.analysis.estimated_value_min || '20'}
                    </p>
                  </div>

                  {item.analysis.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Description</label>
                      <p className="text-gray-700 whitespace-pre-wrap">{item.analysis.description}</p>
                    </div>
                  )}

                  {item.analysis.color && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Color</label>
                      <p className="text-lg">{item.analysis.color}</p>
                    </div>
                  )}

                  {item.analysis.material && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Material</label>
                      <p className="text-lg">{item.analysis.material}</p>
                    </div>
                  )}

                  {item.analysis.style && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Style</label>
                      <p className="text-lg">{item.analysis.style}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={handleListToEbay}
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      List to eBay
                    </button>
                    <button
                      onClick={handleEdit}
                      className="flex-1 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      Edit Listing
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}

export default BatchItemDetail;