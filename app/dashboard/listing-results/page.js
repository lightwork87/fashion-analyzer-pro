// app/dashboard/listing-results/page.js

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Edit2 } from 'lucide-react';

export default function ListingResultsPage() {
  const [analysis, setAnalysis] = useState(null);
  const [copied, setCopied] = useState({});
  const [editing, setEditing] = useState({});
  const [editedValues, setEditedValues] = useState({});
  const router = useRouter();

  useEffect(() => {
    // Get the analysis result from sessionStorage
    const storedResult = sessionStorage.getItem('analysisResult');
    if (storedResult) {
      const parsedResult = JSON.parse(storedResult);
      setAnalysis(parsedResult);
      setEditedValues(parsedResult);
      // Clear it after retrieving
      sessionStorage.removeItem('analysisResult');
    } else {
      // If no result, redirect back
      router.push('/dashboard/new-listing');
    }
  }, [router]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [field]: true });
    setTimeout(() => {
      setCopied({ ...copied, [field]: false });
    }, 2000);
  };

  const toggleEdit = (field) => {
    setEditing({ ...editing, [field]: !editing[field] });
  };

  const handleEdit = (field, value) => {
    setEditedValues({ ...editedValues, [field]: value });
  };

  const saveToInventory = async () => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisId: analysis.id,
          ...editedValues
        }),
      });

      if (response.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to save to inventory:', error);
    }
  };

  if (!analysis) {
    return (
      <div className="p-6 text-center">
        <p>Loading results...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/new-listing" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold">Listing Analysis Results</h1>
      </div>

      {/* Credits Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          Analysis complete! You have <strong>{analysis.credits_remaining || 0}</strong> credits remaining.
        </p>
      </div>

      {/* Results Grid */}
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedValues.sku}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-md bg-gray-50"
                />
                <button
                  onClick={() => copyToClipboard(editedValues.sku, 'sku')}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  {copied.sku ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <div className="flex items-center gap-2">
                {editing.brand ? (
                  <input
                    type="text"
                    value={editedValues.brand}
                    onChange={(e) => handleEdit('brand', e.target.value)}
                    onBlur={() => toggleEdit('brand')}
                    autoFocus
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                ) : (
                  <input
                    type="text"
                    value={editedValues.brand}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-md bg-gray-50"
                  />
                )}
                <button
                  onClick={() => toggleEdit('brand')}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Item Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
              <input
                type="text"
                value={editedValues.item_type}
                readOnly
                className="w-full px-3 py-2 border rounded-md bg-gray-50"
              />
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <div className="flex items-center gap-2">
                {editing.size ? (
                  <input
                    type="text"
                    value={editedValues.size || ''}
                    onChange={(e) => handleEdit('size', e.target.value)}
                    onBlur={() => toggleEdit('size')}
                    autoFocus
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                ) : (
                  <input
                    type="text"
                    value={editedValues.size || 'Not specified'}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-md bg-gray-50"
                  />
                )}
                <button
                  onClick={() => toggleEdit('size')}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition Score (1-10)
              </label>
              <input
                type="number"
                value={editedValues.condition_score}
                readOnly
                className="w-full px-3 py-2 border rounded-md bg-gray-50"
              />
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Value
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">
                  £{editedValues.estimated_value_min} - £{editedValues.estimated_value_max}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* eBay Title */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium">eBay Title</h2>
            <span className="text-sm text-gray-500">
              {editedValues.ebay_title?.length || 0}/80 characters
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={editedValues.ebay_title}
              onChange={(e) => handleEdit('ebay_title', e.target.value)}
              maxLength={80}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <button
              onClick={() => copyToClipboard(editedValues.ebay_title, 'title')}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              {copied.title ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium">Description</h2>
            <button
              onClick={() => copyToClipboard(editedValues.description, 'description')}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              {copied.description ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            value={editedValues.description}
            onChange={(e) => handleEdit('description', e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        {/* Suggested Price */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium mb-4">Pricing</h2>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggested Price
              </label>
              <div className="flex items-center">
                <span className="text-2xl font-semibold text-green-600">
                  £{editedValues.suggested_price || editedValues.estimated_value_min}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          <Link
            href="/dashboard/new-listing"
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Analyze Another
          </Link>
          <div className="flex gap-3">
            <button
              onClick={saveToInventory}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Save to Inventory
            </button>
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => {
                // In future, this will post directly to eBay
                alert('Direct eBay posting coming soon!');
              }}
            >
              List on eBay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}