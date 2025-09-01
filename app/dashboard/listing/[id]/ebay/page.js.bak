// app/dashboard/listing/[id]/ebay/page.js
// EBAY LISTING PAGE - CORRECT PATH (singular)

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Copy, 
  CheckCircle,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function EbayListingPage() {
  const params = useParams();
  const router = useRouter();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState({});

  useEffect(() => {
    fetchAnalysis();
  }, [params.id]);

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`/api/analyses/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      } else {
        setError('Analysis not found');
      }
    } catch (err) {
      setError('Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied({ ...copied, [field]: true });
      setTimeout(() => {
        setCopied({ ...copied, [field]: false });
      }, 2000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              {error || 'Analysis not found'}
            </h2>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 mt-4"
            >
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
        <div className="mb-8">
          <Link
            href={`/dashboard/results?id=${params.id}`}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Results
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">eBay UK Listing</h1>
          <p className="text-gray-600 mt-2">
            Copy the details below to create your eBay listing
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title (80 characters max)
                </label>
                <h2 className="text-lg font-semibold text-gray-900">
                  {analysis.ebay_title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {analysis.ebay_title.length}/80 characters
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(analysis.ebay_title, 'title')}
                className="p-2 hover:bg-gray-100 rounded-lg transition ml-4"
              >
                {copied.title ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <p className="text-gray-900">{analysis.category}</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Item Specifics
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Brand</p>
                <p className="font-medium">{analysis.brand}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Size</p>
                <p className="font-medium">{analysis.size}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Colour</p>
                <p className="font-medium">{analysis.color}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Condition</p>
                <p className="font-medium">Used - {analysis.condition_score}/10</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Style</p>
                <p className="font-medium">{analysis.style || 'Casual'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Material</p>
                <p className="font-medium">{analysis.material}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Starting Price
            </label>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-gray-900">
                £{analysis.suggested_price}
              </p>
              <p className="text-sm text-gray-600">
                (Estimated value: £{analysis.estimated_value_min} - £{analysis.estimated_value_max})
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-start justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
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
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap text-gray-700">
                {analysis.description}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU (Custom Label)
            </label>
            <p className="font-mono text-gray-900">{analysis.sku}</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">eBay UK Listing Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Use all 24 photo slots - more photos increase sales by up to 30%</li>
            <li>• List items ending on Sunday evening for maximum visibility</li>
            <li>• Offer free postage when possible - eBay promotes these listings</li>
            <li>• Consider accepting offers to increase buyer interest</li>
            <li>• Ship within 1 business day for better seller ratings</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <a href="https://www.ebay.co.uk/sl/sell" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <ShoppingBag className="w-5 h-5" />
            Open eBay Sell Form
            <ExternalLink className="w-4 h-4" />
          </a>
          
          <Link href="/dashboard" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default EbayListingPage;