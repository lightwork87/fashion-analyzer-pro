// app/dashboard/results/page.js
// UPDATED TO HANDLE BOTH STORAGE AND URL PARAMETER

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Package, 
  Tag, 
  PoundSterling, 
  FileText, 
  Copy, 
  Check,
  ExternalLink,
  Edit,
  ArrowLeft,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        // First try sessionStorage
        const stored = sessionStorage.getItem('analysisResult');
        if (stored) {
          setAnalysis(JSON.parse(stored));
          sessionStorage.removeItem('analysisResult');
          setLoading(false);
          return;
        }

        // If not in storage, check URL parameter
        const analysisId = searchParams.get('id');
        if (analysisId) {
          // Fetch from database
          const response = await fetch(`/api/analyses/${analysisId}`);
          if (response.ok) {
            const data = await response.json();
            setAnalysis(data.analysis);
          } else {
            setError('Analysis not found');
          }
        } else {
          // No analysis available
          router.push('/dashboard');
        }
      } catch (err) {
        setError('Failed to load analysis');
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [router, searchParams]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading results...</div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'No analysis found'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI Analysis Complete</h1>
          </div>
          <p className="text-gray-600">
            Your item has been analyzed and listing created
          </p>
        </div>

        {/* Main Results Card */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Title Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  eBay UK Title (AI Generated)
                </label>
                <h2 className="text-xl font-semibold text-gray-900">
                  {analysis.ebay_title}
                </h2>
              </div>
              <button
                onClick={() => copyToClipboard(analysis.ebay_title, 'title')}
                className="ml-4 p-2 hover:bg-white/50 rounded transition"
              >
                {copied === 'title' ? 
                  <Check className="w-5 h-5 text-green-600" /> : 
                  <Copy className="w-5 h-5 text-gray-600" />
                }
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Key Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Package className="w-4 h-4 mr-1" />
                  Brand
                </div>
                <p className="font-semibold text-gray-900">{analysis.brand}</p>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Tag className="w-4 h-4 mr-1" />
                  Type
                </div>
                <p className="font-semibold text-gray-900">{analysis.item_type}</p>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <PoundSterling className="w-4 h-4 mr-1" />
                  Price Range
                </div>
                <p className="font-semibold text-gray-900">
                  £{analysis.estimated_value_min} - £{analysis.estimated_value_max}
                </p>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <FileText className="w-4 h-4 mr-1" />
                  SKU
                </div>
                <p className="font-semibold text-gray-900">{analysis.sku}</p>
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Item Specifics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Size:</span>
                  <span className="ml-2 font-medium">{analysis.size}</span>
                </div>
                <div>
                  <span className="text-gray-600">Colour:</span>
                  <span className="ml-2 font-medium">{analysis.color || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Condition:</span>
                  <span className="ml-2 font-medium">{analysis.condition_score}/10</span>
                </div>
                {analysis.gender && (
                  <div>
                    <span className="text-gray-600">Gender:</span>
                    <span className="ml-2 font-medium">{analysis.gender}</span>
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
            </div>

            {/* Suggested Price */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">AI Suggested Price</p>
                  <p className="text-2xl font-bold text-green-900">£{analysis.suggested_price}</p>
                </div>
                <PoundSterling className="w-8 h-8 text-green-600" />
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  eBay Description (AI Generated)
                </label>
                <button
                  onClick={() => copyToClipboard(analysis.description, 'description')}
                  className="p-1 hover:bg-gray-100 rounded transition"
                >
                  {copied === 'description' ? 
                    <Check className="w-4 h-4 text-green-600" /> : 
                    <Copy className="w-4 h-4 text-gray-600" />
                  }
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {analysis.description}
                </p>
              </div>
            </div>

            {/* Keywords */}
            {analysis.keywords && analysis.keywords.length > 0 && (
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Search Keywords
                </label>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywords.map((keyword, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push(`/dashboard/listing/${analysis.id}/ebay`)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                List on eBay UK
              </button>
              
              <button
                onClick={() => router.push(`/dashboard/listing/${analysis.id}/vinted`)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Export for Vinted
              </button>
              
              <button
                onClick={() => router.push(`/dashboard/listing/${analysis.id}/edit`)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Credits Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Credits remaining: <span className="font-semibold">{analysis.credits_remaining || 'N/A'}</span>
          </p>
          <button
            onClick={() => router.push('/dashboard/analyze-single')}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Analyze Another Item →
          </button>
        </div>
      </div>
    </div>
  );
}