// app/dashboard/results/page.js
// RESULTS DISPLAY PAGE

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, DollarSign, Tag, FileText, Copy, Check } from 'lucide-react';

export default function ResultsPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('analysisResult');
    if (stored) {
      setAnalysis(JSON.parse(stored));
      sessionStorage.removeItem('analysisResult');
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
          <p className="text-gray-600 mt-2">
            Your item has been analyzed successfully
          </p>
        </div>

        {/* Main Results */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          {/* Title Section */}
          <div className="mb-6 pb-6 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">eBay Title</label>
                <h2 className="text-xl font-semibold text-gray-900 mt-1">
                  {analysis.ebay_title}
                </h2>
              </div>
              <button
                onClick={() => copyToClipboard(analysis.ebay_title, 'title')}
                className="ml-4 p-2 text-gray-600 hover:text-gray-900"
              >
                {copied === 'title' ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Package className="w-4 h-4 mr-1" />
                Brand
              </div>
              <p className="font-semibold">{analysis.brand}</p>
            </div>
            
            <div>
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Tag className="w-4 h-4 mr-1" />
                Type
              </div>
              <p className="font-semibold">{analysis.item_type}</p>
            </div>
            
            <div>
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <DollarSign className="w-4 h-4 mr-1" />
                Price Range
              </div>
              <p className="font-semibold">
                ${analysis.estimated_value_min} - ${analysis.estimated_value_max}
              </p>
            </div>
            
            <div>
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <FileText className="w-4 h-4 mr-1" />
                SKU
              </div>
              <p className="font-semibold">{analysis.sku}</p>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-sm">
            <div>
              <span className="text-gray-600">Size:</span>
              <span className="ml-2 font-medium">{analysis.size || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-gray-600">Condition:</span>
              <span className="ml-2 font-medium">{analysis.condition_score}/10</span>
            </div>
            <div>
              <span className="text-gray-600">Suggested Price:</span>
              <span className="ml-2 font-medium">${analysis.suggested_price}</span>
            </div>
            {analysis.color && (
              <div>
                <span className="text-gray-600">Color:</span>
                <span className="ml-2 font-medium">{analysis.color}</span>
              </div>
            )}
            {analysis.material && (
              <div>
                <span className="text-gray-600">Material:</span>
                <span className="ml-2 font-medium">{analysis.material}</span>
              </div>
            )}
            <div>
              <span className="text-gray-600">Category:</span>
              <span className="ml-2 font-medium">{analysis.category}</span>
            </div>
          </div>

          {/* Description */}
          <div className="pt-6 border-t">
            <div className="flex items-start justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <button
                onClick={() => copyToClipboard(analysis.description, 'description')}
                className="p-1 text-gray-600 hover:text-gray-900"
              >
                {copied === 'description' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{analysis.description}</p>
          </div>
        </div>

        {/* Credits Remaining */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            Credits remaining: <span className="font-semibold">{analysis.credits_remaining}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/dashboard/smart-upload')}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Analyze Another Item
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}