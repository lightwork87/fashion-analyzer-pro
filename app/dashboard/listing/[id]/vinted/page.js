'use client';

// app/dashboard/listing/[id]/vinted/page.js
// VINTED EXPORT PAGE - CORRECT PATH (singular)

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Package, 
  Copy, 
  CheckCircle,
  Loader2,
  AlertCircle,
  Download
} from 'lucide-react';

VintedListingPage() {
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

  const generateVintedTitle = () => {
    return `${analysis.brand} ${analysis.item_type} ${analysis.color} Size ${analysis.size}`.trim();
  };

  const generateVintedDescription = () => {
    return `${analysis.brand} ${analysis.item_type}

Size: ${analysis.size}
Colour: ${analysis.color}
Condition: ${analysis.condition_score}/10

${analysis.description}

Feel free to ask any questions! 😊`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
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

  const vintedTitle = generateVintedTitle();
  const vintedDescription = generateVintedDescription();

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
          
          <h1 className="text-3xl font-bold text-gray-900">Vinted Listing</h1>
          <p className="text-gray-600 mt-2">
            Optimised listing details for Vinted UK
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <h2 className="text-lg font-semibold text-gray-900">
                  {vintedTitle}
                </h2>
              </div>
              <button
                onClick={() => copyToClipboard(vintedTitle, 'title')}
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

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <p className="text-gray-900">{analysis.gender} {analysis.item_type}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <p className="text-gray-900">{analysis.brand}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size
              </label>
              <p className="text-gray-900">{analysis.size}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <p className="text-gray-900">Good ({analysis.condition_score}/10)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colour
              </label>
              <p className="text-gray-900">{analysis.color}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material
              </label>
              <p className="text-gray-900">{analysis.material}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price
            </label>
            <div className="flex items-center gap-4">
              <p className="text-2xl font-bold text-gray-900">
                £{Math.round(analysis.suggested_price * 0.85)}
              </p>
              <p className="text-sm text-gray-600">
                (Recommended 15% lower than eBay for quick sale)
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-start justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <button
                onClick={() => copyToClipboard(vintedDescription, 'description')}
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
                {vintedDescription}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suggested Hashtags
            </label>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords?.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm cursor-pointer hover:bg-purple-200"
                  onClick={() => copyToClipboard(`#${keyword.replace(/\s+/g, '')}`, `tag-${index}`)}
                >
                  #{keyword.replace(/\s+/g, '')}
                  {copied[`tag-${index}`] && <CheckCircle className="inline w-3 h-3 ml-1" />}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-purple-900 mb-3">Vinted UK Tips</h3>
          <ul className="space-y-2 text-sm text-purple-800">
            <li>• Price 10-20% lower than eBay for faster sales</li>
            <li>• Use all 20 photo slots available</li>
            <li>• Respond to messages quickly - Vinted tracks response time</li>
            <li>• Bundle items for better deals and save on postage</li>
            <li>• Include measurements for better buyer confidence</li>
            <li>• Use relevant hashtags to increase visibility</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <a href="https://www.vinted.co.uk/items/new" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            <Package className="w-5 h-5" />
            Open Vinted
          </a>
          
          <Link href="/dashboard" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VintedListingPage;