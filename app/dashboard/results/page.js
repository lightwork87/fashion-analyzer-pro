// app/dashboard/results/page.js
// FIXED VERSION WITH SUSPENSE BOUNDARY

'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  Ruler, 
  Palette, 
  Star,
  PoundSterling,
  Copy,
  CheckCircle,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';

// Loading component for Suspense
function ResultsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading results...</p>
      </div>
    </div>
  );
}

// Main results component
function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState({ title: false, description: false });
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        // First try sessionStorage
        const storedData = sessionStorage.getItem('analysisResult');
        if (storedData) {
          setAnalysis(JSON.parse(storedData));
          sessionStorage.removeItem('analysisResult');
          setLoading(false);
          return;
        }

        // If no sessionStorage, check URL parameter
        const analysisId = searchParams.get('id');
        if (analysisId) {
          // Fetch from database
          const response = await fetch(`/api/analyses/${analysisId}`);
          if (response.ok) {
            const data = await response.json();
            setAnalysis(data.analysis);
          } else {
            setError('Could not load analysis results');
          }
        } else {
          setError('No analysis data found');
        }
      } catch (err) {
        console.error('Error loading results:', err);
        setError('Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [searchParams]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied({ ...copied, [field]: true });
      setTimeout(() => {
        setCopied({ ...copied, [field]: false });
      }, 2000);
    });
  };

  if (loading) {
    return <ResultsLoading />;
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              {error || 'No results found'}
            </h2>
            <p className="text-red-700 mb-4">
              Please try analyzing your item again.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
          <p className="text-gray-600 mt-2">
            Your item has been analyzed and listing details generated
          </p>
        </div>

        {/* Credits Remaining */}
        {analysis.credits_remaining !== undefined && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>{analysis.credits_remaining} credits remaining</strong> in your account
            </p>
          </div>
        )}

        {/* Main Results */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          {/* Title Section */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-900">
                {analysis.ebay_title}
              </h2>
              <button
                onClick={() => copyToClipboard(analysis.ebay_title, 'title')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {copied.title ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
            <p className="text-sm text-gray-600">
              SKU: {analysis.sku}
            </p>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center text-gray-600 mb-1">
                <Tag className="w-4 h-4 mr-1" />
                <span className="text-xs">Brand</span>
              </div>
              <p className="font-semibold">{analysis.brand}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center text-gray-600 mb-1">
                <Ruler className="w-4 h-4 mr-1" />
                <span className="text-xs">Size</span>
              </div>
              <p className="font-semibold">{analysis.size}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center text-gray-600 mb-1">
                <Palette className="w-4 h-4 mr-1" />
                <span className="text-xs">Colour</span>
              </div>
              <p className="font-semibold">{analysis.color}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center text-gray-600 mb-1">
                <Star className="w-4 h-4 mr-1" />
                <span className="text-xs">Condition</span>
              </div>
              <p className="font-semibold">{analysis.condition_score}/10</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-900 mb-1">Suggested Price</p>
                <p className="text-2xl font-bold text-blue-900">
                  £{analysis.suggested_price}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">Estimated Value Range</p>
                <p className="text-lg text-blue-800">
                  £{analysis.estimated_value_min} - £{analysis.estimated_value_max}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Category</p>
              <p className="font-medium">{analysis.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Item Type</p>
              <p className="font-medium">{analysis.item_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Gender</p>
              <p className="font-medium">{analysis.gender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Material</p>
              <p className="font-medium">{analysis.material}</p>
            </div>
          </div>

          {/* Description */}
          <div className="border-t pt-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Description</h3>
              <button
                onClick={() => copyToClipboard(analysis.description, 'description')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {copied.description ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-gray-700">
                {analysis.description}
              </p>
            </div>
          </div>

          {/* Keywords */}
          {analysis.keywords && analysis.keywords.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/dashboard/listing/${analysis.id}/ebay`}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <ShoppingBag className="w-5 h-5" />
            List on eBay UK
          </Link>
          
          <Link
            href={`/dashboard/listing/${analysis.id}/vinted`}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Package className="w-5 h-5" />
            Export for Vinted
          </Link>
          
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Analyze Another Item
          </Link>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsLoading />}>
      <ResultsContent />
    </Suspense>
  );
}